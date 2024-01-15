/* eslint-disable react/prop-types */

const UsersList = ({ usersList }) => {
  return (
    <div>
      {usersList.map((user, i) => {
        return user.numberOfGames > 0 ? (
          <div key={i}>
            <div className="result" style={{ textAlign: 'center' }}>
              <p>
                {user.username}: Initial Rating: {user.initialRating} 🔚 Final
                Rating: {user.finalRating}
              </p>

              <p>
                Rating Difference: {user.ratingDifference}
                {user.ratingDifference > 0
                  ? ' 📈🔥'
                  : user.ratingDifference === 0
                  ? '🤔🤨'
                  : ' 📉🙈'}
              </p>

              <p>Number of games: {user.numberOfGames}</p>
            </div>
          </div>
        ) : (
          <p key={i}>
            No games played by {user.username} in this period, in this time
            control.
          </p>
        );
      })}
    </div>
  );
};
export default UsersList;
