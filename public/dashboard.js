// public/js/dashboard.js

let dataChart = null;
const REFRESH_INTERVAL = 30000; // 30 seconds

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
  initChart();
  setupEventListeners();
  updateLastUpdatedTime();
  
  // Set up auto-refresh
  setInterval(refreshData, REFRESH_INTERVAL);
});

// Set up all event listeners
function setupEventListeners() {
  // Toggle data table
  document.getElementById('toggle-table').addEventListener('click', function() {
    const tableContainer = document.getElementById('data-table-container');
    const isHidden = tableContainer.classList.contains('hidden');
    
    if (isHidden) {
      tableContainer.classList.remove('hidden');
      this.textContent = 'Hide All Records';
    } else {
      tableContainer.classList.add('hidden');
      this.textContent = 'Show All Records';
    }
  });
  
  // Chart parameter change
  document.getElementById('chart-parameter').addEventListener('change', updateChart);
  
  // Time range change
  document.getElementById('time-range').addEventListener('change', updateChart);
  
  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', refreshData);
}

// Initialize the chart
function initChart() {
  const ctx = document.getElementById('data-chart').getContext('2d');
  
  dataChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'PM2.5',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Value'
          }
        }
      }
    }
  });
  
  // Initial chart update
  updateChart();
}

// Update chart based on selected parameter and time range
async function updateChart() {
  const parameter = document.getElementById('chart-parameter').value;
  const timeRange = document.getElementById('time-range').value;
  
  try {
    // Fetch all data
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch data');
    
    let data = await response.json();
    
    // Apply time range filter
    if (timeRange !== 'all') {
      data = data.slice(-parseInt(timeRange));
    }
    
    // Extract timestamps for labels (combine date and time)
    const labels = data.map(item => {
      return `${item.Date} ${item.Time}`;
    });
    
    // Extract selected parameter values
    const values = data.map(item => parseFloat(item[parameter] || 0));
    
    // Update chart
    dataChart.data.labels = labels;
    dataChart.data.datasets[0].label = parameter;
    dataChart.data.datasets[0].data = values;
    
    // Update y-axis title
    dataChart.options.scales.y.title.text = getUnitForParameter(parameter);
    
    // Update chart
    dataChart.update();
    
  } catch (error) {
    console.error('Error updating chart:', error);
  }
}

// Get appropriate unit for the selected parameter
function getUnitForParameter(parameter) {
  switch(parameter) {
    case 'PM2.5':
    case 'PM10':
      return 'µg/m³';
    case 'Temperature':
      return '°C';
    case 'Pressure':
      return 'hPa';
    case 'Humidity':
      return '%';
    default:
      return 'Value';
  }
}

// Refresh all data
async function refreshData() {
  try {
    // Refresh the chart
    await updateChart();
    
    // Fetch the updated data for the current status cards
    const response = await fetch('/api/recent');
    if (!response.ok) throw new Error('Failed to fetch data');
    
    const recentData = await response.json();
    
    if (recentData.length > 0) {
      const lastRecord = recentData[recentData.length - 1];
      const previousRecord = recentData[recentData.length - 2] || null;
      
      // Update current status sections (simplified - in a real app, would update all values)
      updateCurrentStatus(lastRecord, previousRecord);
    }
    
    // Update last updated time
    updateLastUpdatedTime();
    
    // Add fade-in effect
    const elementsToAnimate = document.querySelectorAll('#current-data, #air-quality');
    elementsToAnimate.forEach(el => {
      el.classList.remove('fade-in');
      void el.offsetWidth; // Trigger reflow
      el.classList.add('fade-in');
    });
    
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
}

// Update the current status section with the latest data
function updateCurrentStatus(lastRecord, previousRecord) {
  // In a real implementation, this would update all the status values
  // This is a simplified version that would need to be expanded
  console.log('Updated with latest record:', lastRecord);
  
  // For a complete implementation, you would update the DOM elements with the new values
  // This would require additional code to update each status card
}

// Update the last updated timestamp
function updateLastUpdatedTime() {
  const lastUpdatedEl = document.getElementById('last-updated');
  const now = new Date();
  lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}