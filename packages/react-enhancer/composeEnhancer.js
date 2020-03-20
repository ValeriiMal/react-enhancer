import { createElement as ce } from 'react';
import compose from 'ramda.compose';

// Enhancer :: Tuple (Component, Props) -> Tuple (Component, Props)
// composeEnhancer :: Array Enhancer -> Component -> Props -> Element
const composeEnhancer = enhancerList => {
  return (Component) => (props) =>
    compose(
      ([C, P]) => ce(C, P),
      ...enhancerList
    )([Component, props]);
};

export {
	composeEnhancer,
};
