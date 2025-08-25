export interface PFCardProps {
  capitalGrowthPct: number;
  rentalYieldPct: number;
}

const PropertyFinancialCard = ({
  capitalGrowthPct,
  rentalYieldPct,
}: PFCardProps) => {
  return (
    <div className="w-full h-full flex flex-row items-center bg-white rounded-2xl border border-sky-900 p-10 gap-12 text-center">
      {/* Capital Growth */}
      <div className="flex-1">
        <p className="text-3xl font-extrabold text-blue-600 mb-2">
          {capitalGrowthPct}% p.a.
        </p>
        <p className="text-md text-gray-600 tracking-wide uppercase">
          Projected Capital Growth (1-year)
        </p>
      </div>

      {/* Divider */}
      <div className="w-px bg-sky-900 h-12" />

      {/* Rental Yield */}
      <div className="flex-1">
        <p className="text-3xl font-extrabold text-green-600 mb-2">
          {rentalYieldPct}% p.a.
        </p>
        <p className="text-md text-gray-600 tracking-wide uppercase">
          Estimated Rental Yield (1-year)
        </p>
      </div>
    </div>
  );
};

export default PropertyFinancialCard;
