import { useEffect, useState } from "react";

export default function LoadingBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress from 0 to 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate progress (starts fast, slows down near end)
        const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (progress >= 100) {
    // Fade out after completion
    setTimeout(() => {
      // Component will be removed by parent
    }, 300);
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-baco-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
