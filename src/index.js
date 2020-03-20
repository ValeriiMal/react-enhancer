import React, { createElement as ce } from "react";
import ReactDOM from "react-dom";
import debounce from "lodash.debounce";
import {
  compose,
  curry,
  assoc,
  propEq,
  not,
  either,
  allPass,
  anyPass,
  identity,
  merge,
  omit,
} from "ramda";

import "./styles.css";

const addState = ([C, P]) => {
  const Result = props => {
    const [v, setV] = React.useState("");

    React.useEffect(() => {
      if (typeof(props.value) === 'string') {
        setV(props.value);
      }
    }, [props.value]);

    let handleChange = e => {
      setV(e.target.value);
      props.onChange(e);
    };

    return ce(C, {
      ...props,
      value: v,
      onChange: handleChange
    });
  };
  return [Result, P];
};

const addInputFlicker = ([C, P]) => {
  const Result = props => {
    const [flicked, setFlicked] = React.useState(false);
    let handleChange = e => {
      if (flicked) {
        setFlicked(false);
        props.onChange(e);
      } else {
        setFlicked(true);
      }
    };
    return ce(C, { ...props, onChange: handleChange });
  };
  return [Result, P];
};

// Enhancer :: Tuple (Component, Props) -> Tuple (Component, Props)
// Array Enhancer -> Component -> Props -> Element
const composeEnhancer = enhancerList => {
  return (Component) => (props) =>
    compose(
      ([C, P]) => ce(C, P),
      ...enhancerList
    )([Component, props]);
};

const createComponentEnhancer = (enhanceComponent /*HOC*/) => {
  return ([C, P]) => [enhanceComponent(C), P];
};

const createPropsEnhancer = (enhanceProps/*Map Transformer*/) => {
  return ([C, P]) => [C, enhanceProps(P)];
};

const addDebouncedChange = createPropsEnhancer(
  P => assoc('onChange', debounce(P.onChange, 1000), P),
);

const shadow = {
  boxShadow: "1px 1px 1px 1px black"
};
const addBoxShadow = createPropsEnhancer( P => {
  return assoc('style', merge(P.style, shadow), P);
});

const createEnhancer = (enhanceComponent /*HOC*/, enhanceProps/*Map Transformer*/) => {
  return ([C, P]) => {
    return [enhanceComponent(C), enhanceProps(P)];
  };
};

const addLogClick = (content, logger = console.log) => createEnhancer(
  // HOC
  identity,
  // Props Transformer
  (P) => {
    const click = (e) => {
      logger(content);
      if (typeof(P.onClick) === 'function') {
        P.onClick(e);
      }
    };
    return assoc('onClick', click, P);
  },
);

const noop = () => {};

const addClickFilter = createPropsEnhancer(assoc('onClick', noop));

const addPrefixText = (text) => createComponentEnhancer((C) => {
  const Result = (props) => {
    return ce(C, props, text, props.children);
  };
  Result.displayName = 'AddPrefixTextEnhancer';
  return Result;
});

const addExtendOnFocus = createComponentEnhancer((C) => {
  const Result = (props) => {
    const [style, setStyle] = React.useState(props.style || {});
    const onFocus = (e) => {
      setStyle({
        ...style,
        // display: 'block',
        width: 200,
      });
      if (typeof (props.onFocus) === 'function') {
        props.onFocus(e);
      }
    };
    const onBlur = (e) => {
      setStyle(props.style || {});
      if (typeof (props.onBlur) === 'function') {
        props.onBlur(e);
      }
    };
    return ce(C, { ...props, onFocus, onBlur, style });
  };
  Result.displayName = 'AddExtendOnFocusEnhancer';
  return Result;
});

const addExtendOnFocus2 = (C) => (props) => {
  const [style, setStyle] = React.useState(props.style || {});
  const onFocus = (e) => {
    setStyle({
      ...style,
      // display: 'block',
      width: 200,
    });
    if (typeof (props.onFocus) === 'function') {
      props.onFocus(e);
    }
  };
  const onBlur = (e) => {
    setStyle(props.style || {});
    if (typeof (props.onBlur) === 'function') {
      props.onBlur(e);
    }
  };
  return ce(C, { ...props, onFocus, onBlur, style });
};

const addChildrenFilter = (type) => createPropsEnhancer((props) => {
  const filtered = React.Children
    .map(props.children, child => child)
    .filter(compose(not, anyPass([
      child => typeof (child) === 'string' && type === 'string',
      compose(propEq('type', type)),
    ])));
  return assoc('children', filtered, props);
});

// Component -> Props -> Element
const enhanceInput = composeEnhancer([
  addBoxShadow,
  addInputFlicker,
  addState,
  addDebouncedChange
]);

const enhanceButton = composeEnhancer([
  // addChildrenFilter('string'), // does not filter addPrefixText component enhancer result
  addChildrenFilter('span'),
  addExtendOnFocus,
  addPrefixText('Prefix '),
  addLogClick('clicked', console.warn),
  addClickFilter,
  addBoxShadow,
]);

// -------------- Button without enhancer
const withNoClick = (C) => {
  return (props) => {
    return ce(C, { ...props, onClick: noop });
  };
};

let ButtonRegular = (props) => {
  // addBoxShadow
  let style = {
    ...props.style,
    ...shadow,
  };
  // addChildrenFilter
  const children = React.Children
    .map(props.children, child => child)
    .filter(compose(not, anyPass([
      child => typeof (child) === 'string' && props.childrenTypeFilter === 'string',
      compose(propEq('type', props.childrenTypeFilter)),
    ])));
  // addLogClick
  const onClick = (e) => {
    (props.logger || console.log)('clicked');
    if (typeof props.onClick === 'function') {
      props.onClick(e);
    }
  };
  // addPrefixText
  const prefixText = 'Prefix ';
  // addExtendOnFocus
  // ...
  return ce(
    'button',
    {
      ...omit(['childrenTypeFilter', 'logger'], props),
      style,
      onClick,
    },
    prefixText,
    children,
  );
};

// addClickFilter
ButtonRegular = withNoClick(ButtonRegular);
// -------------------------------------

const enhanceButton2 = compose(
  addExtendOnFocus2,
);

const Input = props => ce("input", props);
const InputEnhanced = enhanceInput(Input);

const Button = props => ce("button", props);
const ButtonEnhanced = enhanceButton(Button);

const Button2 = props => ce("button", props);
const ButtonEnhanced2 = enhanceButton2(Button);

function App() {
  const handleButtonClick = () => {
    console.log('handleButtonClick');
  };

  const props = { className: "App" };
  return (
    ce( "div", props,
      ce("h1", null,
        "Hello CodeSandbox"),
      ce("h2", null,
        "After this post you might want to hate me"),
      ce(InputEnhanced, { onChange: () => console.log("ha") }),
      ce("div", { style: { height: 10 } }),
      ce(ButtonEnhanced, { onClick: handleButtonClick },
        "Button",
        ce('span', null, ' span =)')),
      ce("div", { style: { height: 10 } }),
      ce(ButtonEnhanced2, { onClick: handleButtonClick },
        "Button2"),
      ce("div", { style: { height: 10 } }),
      ce(ButtonRegular,
        {
          childrenTypeFilter: 'span',
          onClick: handleButtonClick,
          logger: console.warn
        },
        'ButtonRegular',
        ce('span', null, ' span =)')),
    )
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
