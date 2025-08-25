import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PropertyImageCarouselProps = {
  images: string[];
};

const PropertyImageCarousel = ({ images }: PropertyImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const NextArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      className="absolute top-1/2 right-2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 p-2 rounded-full shadow z-10"
      onClick={onClick}
    >
      <ChevronRight size={24} />
    </button>
  );

  const PrevArrow = ({ onClick }: { onClick?: () => void }) => (
    <button
      className="absolute top-1/2 left-2 -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 p-2 rounded-full shadow z-10"
      onClick={onClick}
    >
      <ChevronLeft size={24} />
    </button>
  );

  const settings = {
    arrows: true,
    infinite: images.length > 1, // only allow if more than one image, else it bugs out
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    beforeChange: (_: number, next: number) => setCurrentIndex(next),
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  const ImageSrc = (img: string) => {
    if (img.startsWith("http")) return img; // Link
    if (img.startsWith("iVBOR")) return "data:image/png;base64," + img; // PNG
    if (img.startsWith("/9j/")) return "data:image/jpeg;base64," + img; // JPG

    return "data:image/jpeg;base64," + img;
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <Slider {...settings}>
          {images.map((img, i) => (
            <div key={i}>
              <img
                src={ImageSrc(img)}
                alt={`Property image ${i + 1}`}
                className="w-full h-[55vh] object-cover"
              />
            </div>
          ))}
        </Slider>
      </div>
      {/* Indicator for photo no. */}
      <div className="mt-3 text-center text-sm font-medium text-gray-700">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

export default PropertyImageCarousel;
