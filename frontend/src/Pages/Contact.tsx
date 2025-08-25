import image from "../assets/Homewise_Logo.png";

// Elements and functions for the contact us page
function Contact() {
  return (
    <div className="flex w-full">
      <div className="w-[45%]">
        <div className="border-b border-black text-5xl font-bold ml-8 mt-8 pb-3 mb-5">
          Contact Us
        </div>
        {/* Company information */}
        <p className="ml-8 text-2xl">
          We’re here to help you find your perfect property. Whether you have a
          question about a listing, need support using our platform, or just
          want some expert advice, the HomeWise team is ready to assist.
        </p>
        <br />
        <p className="ml-8 text-3xl font-bold">General Enquiries</p>
        <br />
        <p className="ml-8 text-2xl">
          Have a question about how HomeWise works or need help navigating the
          site? Get in touch—we’re happy to help.
        </p>
        <br />
        <p className="ml-8 text-2xl">
          <span className="font-bold">Email:</span> support@homewise.com.au
        </p>
        <p className="ml-8 text-2xl">
          <span className="font-bold">Phone:</span> 1300 456 789
        </p>
        <p className="ml-8 text-2xl">
          <span className="font-bold">Hours:</span> Monday to Friday, 9:00am –
          5:00pm AEST
        </p>
      </div>

      {/* Company logo */}
      <div className="flex-1 flex justify-center items-start">
        <img
          src={image}
          alt="HomeWise Logo"
          className="max-w-3xl rounded-lg shadow-2xl mt-10"
        />
      </div>
    </div>
  );
}

export default Contact;
