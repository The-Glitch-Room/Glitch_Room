import React from "react";

const Button = (props) => {
  return (
    <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D600FF] to-[#FF00C8] text-white font-bold shadow-lg hover:shadow-[#00F0FF]/50 transition mt-10 cursor-pointer">
      {props.content}
    </button>
  );
};

export default Button;
