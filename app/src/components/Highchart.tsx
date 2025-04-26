import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const DEFAULT_OPTIONS = {
  title: null,
  subtitle: null,
  credits: { enabled: false },
  legend: { enabled: false },
  tooltip: { enabled: false },
  yAxis: {
    title: { text: '' },
    labels: { enabled: false },
    gridLineWidth: 0,
  },
};

interface HighchartProps {
  options: Highcharts.Options;
}

const Highchart: React.FC<HighchartProps> = ({ options }) => {
  return <HighchartsReact highcharts={Highcharts} options={{ ...DEFAULT_OPTIONS, ...options }} />;
};

export default Highchart;
