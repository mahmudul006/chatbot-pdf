import React, { useState, useEffect } from 'react';

//design a dropdown to select llm model here
export const ModelSelection = () => {
  const [model, setModel] = useState<string>('gpt-3');
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  useEffect(() => {
    // fetch the available models from the server
    fetch('http://localhost:8000/models')
      .then((response) => response.json())
      .then((data) => {
        setModelOptions(data.models);
      });
  }, []);

  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setModel(event.target.value as string);
  };

  return (
    <p>hello</p>
    // <FormControl>
    //   <InputLabel id="model-selection-label">Model</InputLabel>
    //   <Select
    //     labelId="model-selection-label"
    //     id="model-selection"
    //     value={model}
    //     onChange={handleModelChange}
    //   >
    //     {modelOptions.map((model) => (
    //       <MenuItem key={model} value={model}>
    //         {model}
    //       </MenuItem>
    //     ))}
    //   </Select>
    // </FormControl>
  );
};
