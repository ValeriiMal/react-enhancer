const createComponentEnhancer = (enhanceComponent /*HOC*/) => {
  return ([C, P]) => [enhanceComponent(C), P];
};

const createPropsEnhancer = (enhanceProps/*Map Transformer*/) => {
  return ([C, P]) => [C, enhanceProps(P)];
};

const createEnhancer = (enhanceComponent /*HOC*/, enhanceProps/*Map Transformer*/) => {
  return ([C, P]) => {
    return [enhanceComponent(C), enhanceProps(P)];
  };
};

export {
	createEnhancer,
	createComponentEnhancer,
	createPropsEnhancer,
};
