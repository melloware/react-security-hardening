import React from 'react';


const comparisonFn = function (prevProps, nextProps) {
    if (prevProps.location && nextProps.location) {
       return prevProps.location.pathname === nextProps.location.pathname;
    }
    return false;
};

export const memoLocation = (element) => {
    return React.memo(element, comparisonFn);
}