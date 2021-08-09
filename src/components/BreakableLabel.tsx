import React from 'react';

export const BreakableLabel: React.FC<{label: string}> = ({label}) => {
  return (
    <>
      {label.split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {index !== 0 && <br />}
          {line}
        </React.Fragment>
      ))}
    </>
  );
};
