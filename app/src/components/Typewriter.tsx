import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Placeholder from './Placeholder';
import './Typewriter.scss';

interface TypewriterProps {
  text: string; // The text to be displayed
  startDelay?: number; // Optional delay before starting the typing effect
  typingSpeed?: number; // Optional speed of typing effect
}

const Typewriter: React.FC<TypewriterProps> = ({ text, startDelay = 250, typingSpeed = 0.1 }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const uuid = uuidv4();

  useEffect(() => {
    // do animation after loading is done
    if (!isLoading && !isMounted) {
      const typewriter = document.getElementById(`typewriter-${uuid}`);
      const animationName = `typing-${uuid}`;
      const textLength = text.length;
      const duration = textLength * typingSpeed;

      // create a unique animation for each instance
      if (typewriter) {
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

        // remove the right border after the animation ends
        typewriter.addEventListener('animationend', () => {
          setTimeout(() => (typewriter.style.borderRight = 'none'), typingSpeed * 1000);
        });
      }
      setIsMounted(true);
    }
  }, [isLoading, isMounted, text, typingSpeed, uuid]);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), startDelay);
  });

  return (
    <Placeholder width={50} height={14} isReady={!isLoading}>
      <span id={`typewriter-${uuid}`} className="typewriter">
        {text}
      </span>
    </Placeholder>
  );
};

export default Typewriter;
