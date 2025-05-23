import { useEffect, useState } from 'react';

import ChessWebAPI from 'chess-web-api';

import LineChart from './LineChart';
import PeriodForm from './PeriodForm';
import UsersList from './UsersList';
import PacmanLoader from 'react-spinners/PacmanLoader';
const chessAPI = new ChessWebAPI();

function App() {
  // const [user, setUser] = useState({
  //   username: 'potato_king77777',
  //   initialRating: 0,
  //   finalRating: 0,
  //   ratingDifference: 'not found',
  //   loading: false,
  // });
  const initialUser = {
    initialRating: 0,
    finalRating: 0,
    ratingDifference: 'not found',
    loading: false,
    numberOfGames: 0,
  };

  const [user, setUser] = useState({
    username: '',
    ...initialUser,
  });

  const [singleUser, setSingleUser] = useState('true');
  const [usersList, setUsersList] = useState([]);
  const [usersText, setUsersText] = useState('');
  const [type, setType] = useState('180');
  const [data, setData] = useState([]);
  const [startPeriod, setStartPeriod] = useState({
    startYear: new Date().getFullYear(),
    startMonth: new Date().getMonth() + 1,
    startDay: 1,
  });
  const [endPeriod, setEndPeriod] = useState({
    endYear: new Date().getFullYear(),
    endMonth: new Date().getMonth() + 1,
    endDay: new Date().getDate(),
  });
  // const [startPeriod, setStartPeriod] = useState({
  //   startYear: 2023,
  //   startMonth: 3,
  //   startDay: 1,
  // });
  // const [endPeriod, setEndPeriod] = useState({
  //   endYear: 2023,
  //   endMonth: 12,
  //   endDay: 8,
  // });

  const [loading, setLoading] = useState(false);
  const [site, setSite] = useState('chess.com');
  const [perfType, setPerfType] = useState('blitz');

  // MAIN get games from chess.com

  const getChessComGames = async (e, userObject) => {
    e.preventDefault();
    setLoading(true);
    setData([]);
    // console.log({ ...initialUser });
    const resetUser = {
      ...initialUser,
      username: user.username,
    };
    setUser(resetUser);
    userObject && (userObject.loading = true);
    userObject && (userObject.numberOfGames = 0);

    const username = userObject?.username || user.username;

    const { startYear, startMonth, startDay } = startPeriod;
    const { endYear, endMonth, endDay } = endPeriod;

    const numberOfMonths = (endYear - startYear) * 12 + endMonth - startMonth;

    let arrayOfGames = [];

    let isInitialRatingTaken = false;

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
          return game.rules === 'chess';
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
          const result = game[player].result === 'win' ? 'win' : 'loss';

          return {
            date: game.end_time * 1000,
            rating: game[player].rating,
            player: game[player].username,
            url: game.url,
            result: result,
          };
        });

      i === 0 && setData([]);
      arrayOfGames.push(...newGamesArrays);
      setSite('chess.com');
      if (newGamesArrays.length && !isInitialRatingTaken) {
        {
          const initialRating = newGamesArrays[0].rating;
          userObject
            ? (userObject.initialRating = initialRating)
            : setUser((prev) => ({ ...prev, initialRating: initialRating }));
          isInitialRatingTaken = true;
        }
      }

      if (newGamesArrays.length) {
        const finalRating = newGamesArrays[newGamesArrays.length - 1].rating;
        userObject
          ? (userObject.finalRating = finalRating)
          : setUser((prev) => ({
              ...prev,
              finalRating: finalRating,
            }));
      }

      i === numberOfMonths && setLoading(false);
    }
    setData(arrayOfGames);
    setUser((prev) => ({ ...prev, numberOfGames: arrayOfGames.length }));
    !userObject && setUser((prev) => ({ ...prev, loading: false }));
    userObject && (userObject.loading = false);
    userObject && (userObject.numberOfGames = arrayOfGames.length);
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

    !arrayOfGames.length;
  };

  // MAIN get games from lichess.org

  async function getLichessGames(e, userObject) {
    e.preventDefault();
    setLoading(true);
    setData([]);

    const resetUser = {
      ...initialUser,
      username: user.username,
    };
    setUser(resetUser);

    userObject && ((userObject.loading = true), (userObject.numberOfGames = 0));

    const { startYear, startMonth, startDay } = startPeriod;
    const { endYear, endMonth, endDay } = endPeriod;

    const startDate = new Date(startYear, startMonth - 1, startDay).getTime();
    // se la data di fine è nel futuro, usa la data di oggi
    const endDate =
      new Date(endYear, endMonth - 1, endDay).getTime() > new Date().getTime()
        ? new Date().getTime()
        : new Date(endYear, endMonth - 1, endDay).getTime();

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

    const url = `https://lichess.org/api/games/user/${username}?since=${startDate}&until=${endDate}&perfType=${perfType}`;
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
            line.clock.increment === increment
        )
        .map((newLine) => {
          const player =
            newLine.players.white.user.name.toLowerCase() ===
            username.toLowerCase()
              ? 'white'
              : 'black';
          const newDate = newLine.createdAt;
          return {
            date: newDate,
            rating: newLine.players[player].rating,
            player: newLine.players[player].user.name,
            url: `https://lichess.org/${newLine.id}`,
            result: newLine.players[player].result === 'win' ? 'win' : 'loss',
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
            numberOfGames: games.length,
          }));
      !userObject && setUser((prev) => ({ ...prev, loading: false }));
      userObject && (userObject.loading = false);
      userObject && (userObject.numberOfGames = games.length);

      return games;
    } catch (error) {
      console.error('Error fetching or parsing NDJSON:', error);
      setLoading(false);

      return [];
    }
  }

  // MAIN get mulitple users' games
  const getMultipleUsersGames = async (e, completeArray) => {
    setLoading(true);
    const newUsersList = await Promise.all(
      completeArray.map(async (singleUserObject) => {
        site === 'chess.com'
          ? await getChessComGames(e, singleUserObject)
          : await getLichessGames(e, singleUserObject);

        return {
          username: singleUserObject.username,
          initialRating: singleUserObject.initialRating,
          finalRating: singleUserObject.finalRating,
          ratingDifference: singleUserObject.ratingDifference,
          loading: false,
          numberOfGames: singleUserObject.numberOfGames,
        };
      })
    );
    setUsersList(newUsersList);
  };

  // MAIN handle form submit

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setData([]);

    switch (type) {
      case '60':
        setPerfType('bullet');
        break;
      case '180':
        setPerfType('blitz');
        break;
      case '180+2':
        setPerfType('blitz');
        break;
      case '300':
        setPerfType('blitz');
        break;
      case '300+3':
        setPerfType('blitz');
        break;
      case '300+5':
        setPerfType('blitz');
        break;
      case '600':
        setPerfType('rapid');
        break;
      case '600+5':
        setPerfType('rapid');
        break;
      case '900':
        setPerfType('rapid');
        break;
      case '900+10':
        setPerfType('rapid');
        break;
      default:
        setPerfType('blitz');
    }

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
        loading: true,
        numberOfGames: 0,
      }));
      setUsersList(completeArray);
      getMultipleUsersGames(e, completeArray);
    }
  };

  const downloadLostGames = () => {
    const paddedMonth = String(startPeriod.startMonth).padStart(2, '0');
    const monthYearFolderName = `sconfitte_${paddedMonth}_${startPeriod.startYear}_nuove`;

    const lostGames = data.filter((game) => {
      const currentIndex = data.findIndex((g) => g.date === game.date);
      if (currentIndex === -1 || currentIndex === data.length - 1) return false;

      const nextGame = data[currentIndex + 1];
      return nextGame && nextGame.rating < game.rating;
    });

    if (!lostGames.length) {
      alert('No lost games found.');
      return;
    }

    // Numerazione dei link alle partite perse
    const gameLinks = lostGames
      .map((g, index) => `${index + 1}. ${g.url}`)
      .join('\n');

    if (!gameLinks) {
      alert('No valid games to download.');
      return;
    }

    const blob = new Blob([gameLinks], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${monthYearFolderName}/partite.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Scaricate ${lostGames.length} partite perse`);
  };

  useEffect(() => {
    console.log('changed');
  }, [user.loading, loading]);

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
        <h1 style={{ margin: 0 }}>Tiramatto Rating</h1>
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
              <option value="300+3">5+3</option>
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
        {loading ? (
          <div className="loading">
            <h2>Soo many games 🤯</h2>
            <PacmanLoader
              cssOverride={{ left: '-8rem', marginTop: '1rem' }}
              color="yellow"
              loading={loading}
              size={100}
              aria-label="Pacman Loader"
              data-testid="loader"
            />
          </div>
        ) : singleUser && data.length ? (
          <>
            <LineChart data={data} />
            <UsersList usersList={[user]} />
          </>
        ) : (
          !singleUser && <UsersList usersList={usersList} />
        )}
        {data.length > 0 && singleUser && (
          <button
            onClick={downloadLostGames}
            style={{
              color: 'white',
              backgroundColor: 'red',
              marginTop: '1rem',
            }}>
            Download Lost Games
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
