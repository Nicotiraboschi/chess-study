/* eslint-disable react/prop-types */
// /* eslint-disable react/prop-types */
import { useEffect } from 'react';
import Chart from 'chart.js/auto';

const LineChart = ({ data }) => {
  useEffect(() => {
    const ctx = document.getElementById('myChart').getContext('2d');

    const ratings = data.map((game) => game.rating);
    const labels = data.map((game) => {
      console.log(game.date);
      // dev:
      // game.date = new Date(game.date * 1000);
      // prod:
      game.date = new Date(game.date * 1000000);
      return game.date.toLocaleDateString();
    });

    const myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Dati numerici',
            data: ratings,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: true,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });

    return () => myChart.destroy();
  }, [data]);

  return <canvas id="myChart" width="400" height="200"></canvas>;
};

export default LineChart;
