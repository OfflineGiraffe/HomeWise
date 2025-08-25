export interface RCProps {
  score: number;
  description: string;
  loggedIn: boolean;
}

const RecommendationCard = ({ score, description, loggedIn }: RCProps) => {
  return (
    <div className="w-full h-full flex flex-row items-stretch bg-white rounded-2xl border border-sky-900 p-8 gap-8">
      {/* Star Ratings */}
      <div className="flex flex-col items-center justify-center w-1/3">
        <p className="text-xl font-semibold mb-4 text-center">
          Recommendation Score
        </p>
        {description === "" && loggedIn ? (
          <div className="flex justify-center w-full mb-4">
            <span className="loading loading-spinner loading-xl"></span>
          </div>
        ) : (
          <div className="items-center justify-center text-center">
            <StarRating score={score} />
            <p className="text-sm text-gray-600 mt-2">
              {loggedIn && `(${score.toFixed(2)} / 5)`}
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px bg-sky-900 mx-2" />

      {/* AI Justification */}
      <div className="flex-1 flex flex-col justify-center">
        {loggedIn && (
          <p className="text-xl font-semibold mb-4 text-center">
            Score Explainer (AI-Powered)
          </p>
        )}
        <p className="text-gray-700 italic text-md">
          {description === "" && loggedIn && (
            <div className="flex justify-center w-full mb-4">
              <span className="loading loading-spinner loading-xl"></span>
            </div>
          )}
          {loggedIn
            ? description
            : "Please log in to view your personalised recommendation score for this property."}
        </p>
      </div>
    </div>
  );
};

// Calculates the percentage of a star to be coloured gold by substracting the star infex from the score
export const StarRating = ({ score }: { score: number }) => {
  const TOTAL_STARS = 5;

  // function to calculate what percentage of a star to colour in, relative to star's index
  const getFillAmount = (index: number) => {
    const diff = score - index;
    if (diff >= 1) return 100;
    if (diff <= 0) return 0;
    return Math.round(diff * 100);
  };

  const stars = [];

  // iterates through each star, first placing the grey and then the yellow star superimposed over it
  for (let star = 0; star < TOTAL_STARS; star++) {
    const fillPercent = getFillAmount(star);

    stars.push(
      <div key={star} className="relative w-8 h-8 shrink-0">
        <StarSVG className="text-gray-300" />
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fillPercent}%` }}
        >
          <StarSVG className="text-yellow-500" />
        </div>
      </div>,
    );
  }

  // renders the array of star elements
  return <div className="flex space-x-1">{stars}</div>;
};

// Passing the colour relevant (grey or yellow) through className
const StarSVG = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 20 20"
    className={`w-8 h-8 ${className}`}
  >
    // SVG star icons
    <path d="M10 15l-5.878 3.09L5.634 12.5 1 8.91l6.06-.883L10 2.5l2.94 5.527L19 8.91l-4.634 3.59 1.512 5.59z" />
  </svg>
);

export default RecommendationCard;
