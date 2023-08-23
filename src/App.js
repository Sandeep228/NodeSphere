import { Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import Home from "../src/components/Home";
import Form from "./components/Form";
import MyNotes from "./components/MyNotes";

function App() {
  return (
    <ChakraProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<Form />} />
        <Route path="/MyNotes" element={<MyNotes />} />
        <Route />
      </Routes>
    </ChakraProvider>
  );
}

export default App;
