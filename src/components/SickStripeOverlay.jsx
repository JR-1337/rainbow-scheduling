import React from 'react';

// Red diagonal stripe overlay for sick cells. Used by all 4 schedule render
// paths. Color is red-600 (#DC2626), not OTR brand red (#EC3228).
const SickStripeOverlay = () => (
  <div aria-hidden="true"
    className="absolute inset-0 pointer-events-none"
    style={{
      background: 'linear-gradient(to top right, transparent calc(50% - 1px), #DC2626 calc(50% - 1px), #DC2626 calc(50% + 1px), transparent calc(50% + 1px))',
    }} />
);

export default SickStripeOverlay;
