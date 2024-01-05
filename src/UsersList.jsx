/* eslint-disable react/prop-types */
const UsersList = ({ usersList }) => {
  console.log(usersList);
  return (
    <div>
      {usersList.map((user, i) => {
        return (
          <div key={i}>
            {user.loading ? <p>Loading...</p> : null}
            <p>
              {user.username}: start: {user.initialRating} ➡️ end:{' '}
              {user.finalRating}{' '}
              {`(${
                user.ratingDifference > 0
                  ? '+'
                  : user.ratingDifference < 0
                  ? '-'
                  : ''
              }${user.ratingDifference})`}
              {user.ratingDifference > 0
                ? '📈🔥'
                : user.ratingDifference < 0
                ? '📉🥶'
                : '🤷‍♂️'}
            </p>
            <hr />
          </div>
        );
      })}
    </div>
  );
};
export default UsersList;
