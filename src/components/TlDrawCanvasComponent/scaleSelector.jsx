import { setScale } from './soundMappings';

const ScaleSelector = () => {
  const handleScaleChange = (e) => {
    const selectedScale = e.target.value;
    setScale(selectedScale);
  };

  return (
    <div className="scale-selector">
      <label htmlFor="scale">Select Scale:</label>
      <select id="scale" onChange={handleScaleChange}>
        <option value="major">Major</option>
        <option value="harmonicMinor">Harmonic Minor</option>
        <option value="melodicMinor">Melodic Minor</option>
      </select>
    </div>
  );
};

export default ScaleSelector;