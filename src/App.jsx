import { useState } from 'react';

import ChessWebAPI from 'chess-web-api';

import LineChart from './LineChart';
import PeriodForm from './PeriodForm';
const chessAPI = new ChessWebAPI();

function App() {
  // const [user, setUser] = useState('');
  const [user, setUser] = useState('');

  const [type, setType] = useState('180');
  const [data, setData] = useState([]);
  const [initialRating, setInitialRating] = useState(0);
  const [finalRating, setFinalRating] = useState(0);
  const [ratingDifference, setRatingDifference] = useState(0);
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

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setData([]);
    setInitialRating(0);
    setFinalRating(0);
    setRatingDifference(0);

    const { startYear, startMonth, startDay } = startPeriod;
    const { endYear, endMonth, endDay } = endPeriod;

    const numberOfMonths = (endYear - startYear) * 12 + endMonth - startMonth;

    let arrayOfGames = [];

    for (let i = 0; i <= numberOfMonths; i++) {
      let currentYear = startYear + Math.floor((startMonth + i - 1) / 12);
      let currentMonth = ((startMonth + i - 1) % 12) + 1;
      let response;

      try {
        response = await chessAPI.getPlayerCompleteMonthlyArchives(
          user,
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
          const player = game.white.username === user ? 'white' : 'black';

          return {
            date: game.end_time * 1000,
            // date: game.end_time / 1000,
            rating: game[player].rating,
            player: game[player].username,
          };
        });

      i === 0 && setData([]);
      // setData((prev) => [...prev, ...newGamesArrays]);
      arrayOfGames.push(...newGamesArrays);
      setSite('chess.com');
      if (newGamesArrays.length) {
        i === 0 && setInitialRating(newGamesArrays[0].rating);

        if (i === numberOfMonths) {
          setFinalRating(newGamesArrays[newGamesArrays.length - 1].rating);
        }
      } else {
        continue;
      }
    }
    setData(arrayOfGames) && setLoading(false);
    arrayOfGames.length &&
      setRatingDifference(
        arrayOfGames[arrayOfGames.length - 1].rating - arrayOfGames[0].rating
      );
    !arrayOfGames.length && setLoading(false);
  };

  // MAIN get games from lichess.org

  async function fetchNDJSON(e) {
    e.preventDefault();
    setLoading(true);
    setData([]);
    setInitialRating(0);
    setFinalRating(0);
    setRatingDifference(0);

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

    const url = `https://lichess.org/api/games/user/${user}?since=${startDate}`;

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
            newLine.players.white.user.name === user ? 'white' : 'black';
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
      setInitialRating(games[0].rating);
      setFinalRating(games[games.length - 1].rating);
      setRatingDifference(games[games.length - 1].rating - games[0].rating);

      return games;
    } catch (error) {
      console.error('Error fetching or parsing NDJSON:', error);
      setLoading(false);

      return [];
    }
  }

  // MAIN return

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
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
          onSubmit={async (e) => {
            site === 'chess.com'
              ? await submitHandler(e)
              : await fetchNDJSON(e);
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

            <label htmlFor="user">User</label>
            <input
              type="text"
              value={user}
              placeholder="e.g. Hikaru"
              onChange={(e) => setUser(e.target.value)}
            />
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
        {data.length ? (
          <LineChart data={data} />
        ) : loading ? (
          <h1>...Loading</h1>
        ) : (
          <p>No games found </p>
        )}
        <p>Initial Rating: {initialRating}</p>
        <p>Final Rating: {finalRating}</p>
        <p>
          Rating Difference: {ratingDifference}
          {ratingDifference > 0
            ? ' 📈🔥'
            : ratingDifference === 0
            ? '🤔🤨'
            : ' 📉🙈'}
        </p>
      </main>
    </div>
  );
}

export default App;
