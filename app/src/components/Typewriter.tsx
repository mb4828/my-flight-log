import React, { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './Typewriter.scss';

interface TypewriterProps {
  text: string; // The text to be displayed
  startDelay?: number; // Optional delay before starting the typing effect
  typingSpeed?: number; // Optional speed of typing effect
}

const Typewriter: React.FC<TypewriterProps> = ({ text, startDelay = 100, typingSpeed = 0.1 }) => {
  const isMounted = useRef(false);
  const uuid = uuidv4();

  useEffect(() => {
    const typewriter = document.getElementById(`typewriter-${uuid}`);
    const animationName = `typing-${uuid}`;
    const textLength = text.length;
    const duration = textLength * typingSpeed;

    // create a unique animation for each instance
    if (typewriter && !isMounted.current) {
      const style = document.createElement('style');
      style.textContent = `
            @keyframes ${animationName} {
                from { width: 0ch; }
                to { width: ${textLength}ch; }
            }
        `;
      document.head.appendChild(style);

      // apply the animation to the typewriter element
      typewriter.style.animation = `${animationName} ${duration}s steps(${textLength}) 1 both`;
      typewriter.style.animationDelay = `${startDelay}ms`;

      // remove the right border after the animation ends
      typewriter.addEventListener('animationend', () => {
        setTimeout(() => (typewriter.style.borderRight = 'none'), typingSpeed * 1000);
      });
    }
    isMounted.current = true;
  }, [text, startDelay, typingSpeed, uuid]);

  return (
    <span id={`typewriter-${uuid}`} className="typewriter">
      {text}
    </span>
  );
};

export default Typewriter;
