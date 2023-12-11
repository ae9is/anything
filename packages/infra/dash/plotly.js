// Enter in "Script Editor" for the Plotly Grafana plugin

// Plotly Grafana plugin includes dayjs library
//let now = dayjs();
//let then = now.subtract(30, 'day');

const config = {
  responsive: true,
}

const bgcolor = '#181B1F';

const layout = {
  autosize: true,
  font: {
    family: 'Inter, Helvetica, Arial, sans-serif',
    color: 'white',
  },
  paper_bgcolor: bgcolor,
  plot_bgcolor: bgcolor,
  hoverlabel: {
    bgcolor: bgcolor,
  },
  xaxis: {
    // Note: Ideally would want to plot out last N days. All that seems to work is autorange with 1 day spacing.
    //  For explicit tick values, plugin seems to refuse to show any ticks not associated with data, and plots data regardless.
    //  Min/max range allowed doesn't seem to work either.
    type: 'date',
    //autorange: false,
    //minallowed: '2023-12-01',
    //minallowed: then.format('YYYY-MM-DD'),
    //maxallowed: now.format('YYYY-MM-DD'),
    //tickmode: 'linear', // 'array',
    //tick0: then,
    //tick0: '2023-12-01',
    //tick0: then.format('YYYY-MM-DD'),
    //tickvals: tickvals,
    automargin: true,
    //tickformat: '%a, %b %e, %y',
    dtick: '1d',
    tickangle: 45,
    title: {
      text: 'Date (UTC)',
    },
  },
  yaxis: {
    automargin: true,
    autorange: 'max',
    autorangeoptions: {
      minallowed: 0,
    },
    title: {
      text: 'Events',
    },
  },
  showlegend: false,
}

let dates = data.series[0].fields[0].values;
let authors = data.series[0].fields[1].values;
let events = data.series[0].fields[2].values;
let dataByAuth = {};
for (let i = 0; i < dates.length; i++) {
  let currentAuth = authors[i];
  let currentData = dataByAuth[currentAuth] ?? { dates: [], events: [] };
  currentData.dates.push(dates[i]);
  currentData.events.push(events[i]);
  dataByAuth[currentAuth] = currentData;
}
let traces = [];
for (const [auth, authData] of Object.entries(dataByAuth)) {
  let trace = {
    x: authData.dates,
    y: authData.events,
    mode: 'markers',
    type: 'scatter',
    name: auth,
  };
  traces.push(trace);
}

return { data: traces, layout, config };

