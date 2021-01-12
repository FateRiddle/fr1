import React from 'react';
import { useStore } from '../../hooks';

const Title = ({ labelClass, labelStyle, widgetName, schema }) => {
  const { showDescIcon, displayType } = useStore();
  const { title, description, required, type } = schema;
  const isObjType = type === 'object';

  return (
    <div className={labelClass} style={labelStyle}>
      <label
        className={`fr-label-title ${
          widgetName === 'checkbox' || displayType === 'column'
            ? 'no-colon'
            : ''
        }`} // checkbox不带冒号
        title={title}
      >
        {required && <span className="fr-label-required"> *</span>}
        <span
          className={`${isObjType ? 'b' : ''} ${
            displayType === 'column' ? 'flex-none' : ''
          }`}
        >
          {title}
        </span>
        {description &&
          (showDescIcon ? (
            <span className="fr-tooltip-toggle" aria-label={description}>
              <i className="fr-tooltip-icon" />
              <div className="fr-tooltip-container">
                <i className="fr-tooltip-triangle" />
                {description}
              </div>
            </span>
          ) : (
            <span className="fr-desc ml2">(&nbsp;{description}&nbsp;)</span>
          ))}
      </label>
    </div>
  );
};

export default Title;
