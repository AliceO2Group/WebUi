import { type WindowInterface } from './window.d';
import { useFullWindowLogic } from '../hooks/useWindowLogic';

export default (props: WindowInterface) => {
  
  const {className} = props;
  const {visibility, ui_elements: {title, content, closeIcon}} = useFullWindowLogic(props);
  

  return (
      <div className={`alert level1 br2 ${visibility} ${className}`}>
        <div className="flex-row justify-between pv2 ph3">
          {title ?? ''}
          {closeIcon ?? ''}
        </div>
        <div className="p3">
          <div className="mb2">
            {content ?? ''}
          </div>
        </div>
      </div>
  );
};
