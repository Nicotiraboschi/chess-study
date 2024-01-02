import { useEffect, useState } from 'react';

import ChessWebAPI from 'chess-web-api';

const chessAPI = new ChessWebAPI();

import LineChart from './LineChart';

function App() {
  const [user, setUser] = useState('');
  const [type, setType] = useState('');
  const [data, setData] = useState([]); // [1, 2, 3
  const [initialRating, setInitialRating] = useState(0); // [1, 2, 3
  const [finalRating, setFinalRating] = useState(0); // [1, 2, 3
  const [ratingDifference, setRatingDifference] = useState(0); // [1, 2, 3
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(user, year, month, type);
    chessAPI;
    const response = await chessAPI.getPlayerCompleteMonthlyArchives(
      user,
      year,
      month
    );
    console.log(response.body);
    const gamesInRightTimeControl = response.body.games.filter((game) => {
      return game.time_control === type;
    });

    const newGamesArrays = gamesInRightTimeControl.map((game) => {
      const player = game.white.username === user ? 'white' : 'black';

      return {
        date: game.end_time,
        rating: game[player].rating,
        player: game[player].username,
      };
    });
    console.log(newGamesArrays, 'newGamesArrays');
    setData(newGamesArrays);
    if (newGamesArrays.length) {
      setInitialRating(newGamesArrays[0].rating);
      setFinalRating(newGamesArrays[newGamesArrays.length - 1].rating);
      setRatingDifference(
        newGamesArrays[newGamesArrays.length - 1].rating -
          newGamesArrays[0].rating
      );
    } else {
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log(data, 'data');
  }, [data]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        hieght: '100vh',
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
        <p>
          Find out your rating progression over a certain month (just chess.com
          right now)
        </p>
        <form onSubmit={submitHandler}>
          <label htmlFor="user">User</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <label htmlFor="year">year</label>
          <select
            id="year"
            name="year"
            onChange={(e) => setYear(parseInt(e.target.value, 10))}>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>

          <label htmlFor="month">month</label>
          <select
            id="month"
            name="month"
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

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

          <button type="submit">Submit</button>
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
        <p>Rating Difference: {ratingDifference}</p>
      </main>
    </div>
  );
}

export default App;
