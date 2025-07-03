import FoodItemForm from "./FoodItemForm";
import LogModal from "./LogModal";
import { useState } from "react";

export default function FoodItemList() {
  const [showModal, setShowModal] = useState(false);
  const [itemResults, setItemResults] = useState([]);
  const [item, setItem] = useState([]);
  const [chosenItems, setChosenItems] = useState([]);

  const handleItemAdded = (newItems) => {
    setItemResults(newItems);
  };

  const handleItemChosen = (chosenItem) => {
    setChosenItems((prevChosenItems) => [...prevChosenItems, chosenItem]);
    setShowModal(false);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}> Add new food item </button>
      {showModal && (
        <LogModal
          setItemResults={setItemResults}
          itemResults={itemResults}
          setItem={setItem}
          handleItemChosen={handleItemChosen}
          onClose={() => setShowModal(false)}
        >
          {" "}
          <FoodItemForm
            handleItemAdded={handleItemAdded}
            setShowModal={setShowModal}
          />
        </LogModal>
      )}
      {chosenItems.length == 0 && <p> No items yet! </p>}
      {chosenItems.map((chosenItem) => {
        return <p key={chosenItem.id}> {chosenItem.name} </p>;
      })}
    </div>
  );
}
