import { useEffect, useState } from 'react';

import ChessWebAPI from 'chess-web-api';

import LineChart from './LineChart';
import PeriodForm from './PeriodForm';
import UsersList from './UsersList';
const chessAPI = new ChessWebAPI();

function App() {
  // const [user, setUser] = useState('');
  // const [user, setUser] = useState({
  //   username: 'nicotira',
  //   initialRating: 0,
  //   finalRating: 0,
  //   ratingDifference: 0,
  // });
  const [user, setUser] = useState({
    username: '',
    initialRating: 0,
    finalRating: 0,
    ratingDifference: 'not found',
    loading: false,
  });

  const [singleUser, setSingleUser] = useState('true');
  const [usersList, setUsersList] = useState([]);
  const [usersText, setUsersText] = useState('');
  const [type, setType] = useState('180');
  const [data, setData] = useState([]);
  // const [initialRating, setInitialRating] = useState(0);
  // const [finalRating, setFinalRating] = useState(0);
  // const [ratingDifference, setRatingDifference] = useState(0);
  const [startPeriod, setStartPeriod] = useState({
    startYear: new Date().getFullYear(),
    startMonth: new Date().getMonth() + 1,
    startDay: 1,
  });
  // const [endPeriod, setEndPeriod] = useState({
  //   endYear: new Date().getFullYear(),
  //   endMonth: new Date().getMonth() + 1,
  //   endDay: new Date().getDate(),
  // });
  // const [startPeriod, setStartPeriod] = useState({
  //   startYear: 2023,
  //   startMonth: 12,
  //   startDay: 15,
  // });
  const [endPeriod, setEndPeriod] = useState({
    endYear: 2024,
    endMonth: 1,
    endDay: 3,
  });

  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState('chess.com');

  // MAIN get games from chess.com

  const getChessComGames = async (e, userObject) => {
    e.preventDefault();
    setLoading(true);
    setData([]);

    setUser((prev) => ({ ...prev, loading: true }));
    userObject && (userObject.loading = true);

    console.log(userObject, 'userObject', user, 'user');
    const username = userObject?.username || user.username;
    console.log(username, 'username');

    const { startYear, startMonth, startDay } = startPeriod;
    const { endYear, endMonth, endDay } = endPeriod;

    const numberOfMonths = (endYear - startYear) * 12 + endMonth - startMonth;

    let arrayOfGames = [];
    console.log('hi');

    for (let i = 0; i <= numberOfMonths; i++) {
      let currentYear = startYear + Math.floor((startMonth + i - 1) / 12);
      let currentMonth = ((startMonth + i - 1) % 12) + 1;
      let response;

      try {
        response = await chessAPI.getPlayerCompleteMonthlyArchives(
          username,
          currentYear,
          currentMonth
        );
      } catch (error) {
        setLoading(false);
        console.error(error);
      }

      const newGamesArrays = response.body.games
        .filter((game) => {
          return game.time_control === type;
        })
        .filter((game) => {
          const startPeriod =
            new Date(startYear, startMonth - 1, startDay).getTime() / 1000;

          const endPeriod =
            new Date(endYear, endMonth - 1, endDay).getTime() / 1000;
          const gameTimestamp = game.end_time;

          return gameTimestamp >= startPeriod && gameTimestamp < endPeriod;
        })
        .map((game) => {
          const player = game.white.username === username ? 'white' : 'black';

          return {
            date: game.end_time * 1000,
            // date: game.end_time / 1000,
            rating: game[player].rating,
            player: game[player].username,
          };
        });

      i === 0 && setData([]);
      // setData((prev) => [...prev, ...newGamesArrays]);
      console.log(newGamesArrays, 'newGamesArrays');
      arrayOfGames.push(...newGamesArrays);
      setSite('chess.com');
      if (newGamesArrays.length) {
        if (i === 0) {
          const initialRating = newGamesArrays[0].rating;
          userObject
            ? (userObject.initialRating = initialRating)
            : setUser((prev) => ({ ...prev, initialRating: initialRating }));
        }

        if (i === numberOfMonths) {
          const finalRating = newGamesArrays[newGamesArrays.length - 1].rating;
          userObject
            ? (userObject.finalRating = finalRating)
            : setUser((prev) => ({
                ...prev,
                finalRating: finalRating,
              }));
        }
      } else {
        continue;
      }
    }
    setData(arrayOfGames) && setLoading(false);
    !userObject && setUser((prev) => ({ ...prev, loading: false }));
    userObject && (userObject.loading = false);
    if (arrayOfGames.length) {
      const ratingDifference =
        arrayOfGames[arrayOfGames.length - 1].rating - arrayOfGames[0].rating;
      userObject
        ? (userObject.ratingDifference = ratingDifference)
        : setUser((prev) => ({
            ...prev,
            ratingDifference: ratingDifference,
          }));
    }

    !arrayOfGames.length && setLoading(false);
  };

  // MAIN get games from lichess.org

  async function getLichessGames(e, userObject) {
    e.preventDefault();
    setLoading(true);
    setData([]);

    setUser((prev) => ({ ...prev, loading: true }));
    userObject && (userObject.loading = true);

    const { startYear, startMonth, startDay } = startPeriod;
    const { endYear, endMonth, endDay } = endPeriod;

    const startDate = new Date(startYear, startMonth - 1, startDay).getTime();
    const endDate = new Date(endYear, endMonth - 1, endDay);

    let initialSeconds;
    let increment;

    // Definisci la regex per estrarre i numeri prima e dopo il "+"
    const regex = /(\d+)(?:\+(\d+))?/;

    // Esegui la regex sul tipo di controllo del tempo
    const match = type.match(regex);

    if (match) {
      initialSeconds = parseInt(match[1], 10); // Numero prima del "+"
      increment = parseInt(match[2], 10) || 0; // Numero dopo il "+", se presente, altrimenti 0

      // Ora puoi utilizzare initialSeconds e increment come necessario
    } else {
      console.error('Formato del tipo di controllo del tempo non valido');
    }

    const username = userObject?.username || user.username;

    const url = `https://lichess.org/api/games/user/${username}?since=${startDate}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/x-ndjson',
        },
      });

      const ndjsonContent = await response.text();

      // Check if ndjsonContent is empty
      if (ndjsonContent.trim() === '') {
        console.warn('NDJSON content is empty.');
        setLoading(false);
        return [];
      }

      const lines = ndjsonContent.split('\n');
      const games = lines
        .filter((line) => line.trim() !== '')
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch (error) {
            setLoading(false);

            console.error('Error parsing line as JSON:', line, error);
            return null;
          }
        })
        .filter(
          (line) =>
            line.clock.initial === initialSeconds &&
            line.clock.increment === increment &&
            new Date(line.lastMoveAt) < endDate
        )
        .map((newLine) => {
          const player =
            newLine.players.white.user.name === username ? 'white' : 'black';
          console.log(newLine.createdAt);
          const newDate = newLine.createdAt;
          return {
            date: newDate,
            rating: newLine.players[player].rating,
            player: newLine.players[player].user.name,
          };
        });

      games.sort((a, b) => a.date - b.date);

      setData([]);
      setData(games);
      setSite('lichess');
      setLoading(false);
      if (!games.length) {
        setLoading(false);

        return [];
      }
      // setInitialRating(games[0].rating);
      // setFinalRating(games[games.length - 1].rating);
      // setRatingDifference(games[games.length - 1].rating - games[0].rating);

      if (games.length) {
        if (games.length) {
          const initialRating = games[0].rating;
          userObject
            ? (userObject.initialRating = initialRating)
            : setUser((prev) => ({ ...prev, initialRating: initialRating }));
        }

        if (games.length) {
          const finalRating = games[games.length - 1].rating;
          userObject
            ? (userObject.finalRating = finalRating)
            : setUser((prev) => ({
                ...prev,
                finalRating: finalRating,
              }));
        }
      }

      const ratingDifference = games[games.length - 1].rating - games[0].rating;
      userObject
        ? (userObject.ratingDifference = ratingDifference)
        : setUser((prev) => ({
            ...prev,
            ratingDifference: ratingDifference,
          }));
      !userObject && setUser((prev) => ({ ...prev, loading: false }));
      userObject && (userObject.loading = false);

      return games;
    } catch (error) {
      console.error('Error fetching or parsing NDJSON:', error);
      setLoading(false);

      return [];
    }
  }

  // MAIN get mulitple users' games
  const getMultipleUsersGames = async (e, completeArray) => {
    const newUsersList = await Promise.all(
      completeArray.map(async (singleUserObject) => {
        // console.log(singleUserObject, 'singleUser');
        // setUser(singleUserObject.username);

        // console.log(user, 'user');
        site === 'chess.com'
          ? await getChessComGames(e, singleUserObject)
          : await getLichessGames(e, singleUserObject);

        return {
          username: singleUserObject.username,
          initialRating: singleUserObject.initialRating,
          finalRating: singleUserObject.finalRating,
          ratingDifference: singleUserObject.ratingDifference,
          loading: false,
        };
      })
    );
    console.log(newUsersList, 'newUsersList');
    setUsersList(newUsersList);
  };

  // MAIN handle form submit

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setData([]);

    if (singleUser) {
      site === 'chess.com'
        ? await getChessComGames(e)
        : await getLichessGames(e);
    } else {
      const nameArray = usersText.split(/[,\s]+/);
      const completeArray = nameArray.map((singleUserName) => ({
        username: singleUserName,
        initialRating: 0,
        finalRating: 0,
        ratingDifference: 'not found',
      }));
      setUsersList(completeArray);
      console.log(completeArray);
      getMultipleUsersGames(e, completeArray);
      console.log(usersList);
      setLoading(false);
    }
  };

  useEffect(() => {}, [user.loading]);

  // MAIN return

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
      }}>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 'auto',
        }}>
        <h1 style={{ margin: 0 }}>Chess Improvement</h1>
        <p>Find out your rating progression over time 📈</p>
        <form
          onSubmit={(e) => {
            handleFormSubmit(e);
          }}>
          <div style={{ display: 'flex', placeContent: 'center' }}>
            <label htmlFor="site">Site</label>
            <select
              name="site"
              id="site"
              value={site}
              onChange={(e) => setSite(e.target.value)}>
              <option value="chess.com">chess.com</option>
              <option value="lichess">lichess</option>
            </select>

            {!singleUser ? (
              <>
                <label htmlFor="user">Users</label>
                <input
                  type="text"
                  value={usersText}
                  placeholder="e.g. Hikaru, nicotira"
                  onChange={(e) => setUsersText(e.target.value)}
                />
              </>
            ) : (
              <>
                <label htmlFor="user">User</label>
                <input
                  type="text"
                  value={user.username}
                  placeholder="e.g. Hikaru"
                  onChange={(e) =>
                    setUser({ ...user, username: e.target.value })
                  }
                />
              </>
            )}
            <input
              type="checkbox"
              name="checkbox"
              onChange={() => setSingleUser(!singleUser)}
            />
            <label htmlFor="checkbox">Multiple Users (no graph)</label>
          </div>
          <hr />
          <div style={{ display: 'flex', placeContent: 'center' }}>
            <label htmlFor="type">Time control</label>
            <select
              name="type"
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}>
              <option value="60">1</option>
              <option value="180">3</option>
              <option value="180+2">3+2</option>
              <option value="300">5</option>
              <option value="300+5">5+5</option>
              <option value="600">10</option>
              <option value="600+5">10+5</option>
              <option value="900">15</option>
              <option value="900+10">15+10</option>
            </select>
          </div>

          <hr />
          <PeriodForm
            period={'starts'}
            setEndPeriod={setEndPeriod}
            setStartPeriod={setStartPeriod}
            endPeriod={endPeriod}
            startPeriod={startPeriod}
          />
          <hr />
          <PeriodForm
            period={'ends'}
            setEndPeriod={setEndPeriod}
            setStartPeriod={setStartPeriod}
            endPeriod={endPeriod}
            startPeriod={startPeriod}
          />
          <div
            style={{
              display: 'flex',
              placeContent: 'center',
              marginTop: '0.5rem',
            }}>
            <button
              style={{ color: 'black', backgroundColor: 'white' }}
              type="submit">
              Submit
            </button>
          </div>
        </form>
        {singleUser && data.length ? (
          <LineChart data={data} />
        ) : !singleUser && usersList.length ? (
          <UsersList usersList={usersList} />
        ) : loading ? (
          <h1>...Loading</h1>
        ) : (
          <p>No games found </p>
        )}
        {singleUser && (
          <>
            <p>Initial Rating: {user.initialRating}</p>
            <p>Final Rating: {user.finalRating}</p>
            <p>
              Rating Difference: {user.ratingDifference}
              {user.ratingDifference > 0
                ? ' 📈🔥'
                : user.ratingDifference === 0
                ? '🤔🤨'
                : ' 📉🙈'}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
