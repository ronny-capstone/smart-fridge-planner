import { useState } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";

function App() {
  return (
    <>
      <div>
        <LogList />
        <FoodItemList />
      </div>
    </>
  );
}

export default App;
