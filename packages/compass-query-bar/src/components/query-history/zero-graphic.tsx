import React from 'react';
import {
  Body,
  NoSavedItemsIcon,
  css,
  spacing,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  padding: spacing[400],
  textAlign: 'center',
  marginTop: spacing[400], // same spacing as query item
});

const iconContainerStyles = css({
  margin: '0 auto',
});

const descriptionStyles = css({
  maxWidth: spacing[7] * 3,
  margin: '0 auto',
});

function ZeroGraphic({ text }: { text: string }) {
  return (
    <div className={containerStyles}>
      <div className={iconContainerStyles}>
        <NoSavedItemsIcon size={spacing[600] * 2} />
      </div>
      <Body className={descriptionStyles}>{text}</Body>
    </div>
  );
}

export { ZeroGraphic };
