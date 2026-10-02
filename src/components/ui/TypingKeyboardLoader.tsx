import React from 'react';
import { TypingKeyboard, TypingKeyboardProps } from './vengeance/TypingKeyboard';

export const TypingKeyboardLoader: React.FC<TypingKeyboardProps> = (props) => {
  return <TypingKeyboard {...props} />;
};

export { TypingKeyboard };
export type { TypingKeyboardProps };
