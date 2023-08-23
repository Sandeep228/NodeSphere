import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  Flex,
  Stack,
  Text,
  Icon,
  Heading,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Image } from "cloudinary-react";
import { Configuration, OpenAIApi } from "openai";
import { SiMicrosoftonenote } from "react-icons/si";
import { useToast } from "@chakra-ui/react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import axios from "axios";

const configuration = new Configuration({
  apiKey: `${process.env.REACT_APP_OPENAI_API_KEY}`,
});
const openai = new OpenAIApi(configuration);

const themes = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];
// Add your Cloudinary configuration here
const cloudinaryConfig = {
  cloudName: `${process.env.REACT_APP_CLOUDNAME}`,
  apiKey: `${process.env.REACT_APP_CLOUDINARY_API_KEY}`,
  apiSecret: `${process.env.REACT_APP_CLOUDINARY_API_SECRET}`,
};

const Form = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({ continuous: true });

  const { user, isAuthenticated, isLoading } = useAuth0();

  const [desc, setDesc] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "",
    image: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const handleInputChange = (field, value) => {
    console.log("Setting", field, "to", value);
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setisGeneratingImage] = useState(false);
  const generateDescriptionWithAI = async () => {
    setIsGenerating(true);
    try {
      const prompt = `write two paragraphs about ${formData.title}`;
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150, // Adjust as needed
      });

      const description = response.data.choices[0].message.content;
      handleInputChange("content", description);
    } catch (error) {
      console.error("Error generating description:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        `${process.env.REACT_APP_UPLOAD_PRESET}`
      );
      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        const imageUrl = data.secure_url;
        handleInputChange("image", imageUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const GetUserQuery = `
  query User($email: Email!) {
    user(by: {email:$email }) {
      id
    }
  }
`;

  const NoteCreate = `
  mutation NoteCreate($name: String! $description:String! $priority:String! $nodeUrl: URL $owner:ID){
    noteCreate(input: {name:$name description:$description priority:$priority nodeUrl:$nodeUrl owner: {link:$owner}}) {
      note {
       id
      }
    }
  }
  `;

  const getUserByEmailID = async (email) => {
    const response = await fetch(
      "https://notesphere-main-pujaagarwal5263.grafbase.app/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `${process.env.REACT_APP_GRAFBASE_API}`,
        },
        body: JSON.stringify({
          query: GetUserQuery,
          variables: {
            email: email,
          },
        }),
      }
    );

    const result = await response.json();
    return result.data?.user?.id;
  };

  const postEventData = async (formdata, email) => {
    console.log("object", formData);
    const name = formData.title;
    const description = formData.content;
    const priority = formData.priority;
    const nodeUrl = formData.image;
    const userID = await getUserByEmailID(email);

    console.log(
      name,
      " ",
      description,
      " ",
      priority,
      " ",
      userID,
      " ",
      nodeUrl
    );
    const response = await fetch(
      "https://notesphere-main-pujaagarwal5263.grafbase.app/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `${process.env.REACT_APP_GRAFBASE_API}`,
        },
        body: JSON.stringify({
          query: NoteCreate,
          variables: {
            name: name,
            description: description,
            priority: priority,
            nodeUrl: nodeUrl,
            owner: userID,
          },
        }),
      }
    );

    const result = await response.json();
    console.log("result", result);
    if (result.data != null) {
      console.log("event submitted successfully");
      toast({
        title: "Form Submitted",
        description: "Your form has been successfully submitted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      console.log(result);
      console.log("error in saving event");
    }
    return result;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      formData.title == "" ||
      formData.content == "" ||
      formData.priority == ""
    ) {
      toast({
        title: "Error",
        description: "Please submit all the fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      event.preventDefault();
    } else {
      //push new event to grafbase
      await postEventData(formData, user.email);
      setFormData({
        title: "",
        content: "",
        priority: "",
        image: null,
      });
      resetTranscript();
      setDesc("");
    }
  };

  const getImageURLwithAI = async () => {
    setisGeneratingImage(true);
    const url = `https://api.unsplash.com/search/photos?page=1&query=${formData.title}&w=10&h=10&client_id=2urTmpQD0BBUGv-xV0zemBA7gYevDIpNUBeoNhbGaQA`;
    const response = await axios.get(url);
    const imageURL = response.data.results[0].urls.small;

    handleInputChange("image", imageURL);
    setisGeneratingImage(false);
  };

  const setDescription = () => {
    setDesc("transcript");
    if (transcript != "") {
      handleInputChange("description", transcript);
    }
  };

  const clearTranscript = () => {
    resetTranscript();
  };
  const toast = useToast();
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <Box bg="black" p={4}>
      <Flex p={45}>
        <Box w="30%" p={35} bg="#131313" borderRadius=" 35px 0  0 35px">
          <Box mt={200}>
            <Heading size="xl" ml={30} mb={2} color="white">
              <Icon
                as={SiMicrosoftonenote}
                h={5}
                w={6}
                color="white"
                mr="8px"
                m={1}
              />
              NoteSphere
            </Heading>
            <Text color="white" ml={63} fontSize={23}>
              Capturing Thoughts, <br />
              Creating Possibilities
            </Text>
          </Box>
        </Box>
        <Flex direction="column" w="70%" p={4} bg="#242424">
          <Stack spacing={4}>
            <Box pl={100}>
              <Box p={4}>
                <Heading color="white" pb={4}>
                  Craft your Note Details
                </Heading>
                <form onSubmit={handleSubmit}>
                  <FormControl mb={4}>
                    <FormLabel color="white">Title</FormLabel>
                    <Input
                      color="white"
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl mb={5}>
                    <FormLabel color="white">Content</FormLabel>
                    <Textarea
                      color="white"
                      value={transcript != "" ? transcript : formData.content}
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
                    />
                  </FormControl>
                  <HStack>
                    <Text color="white">
                      <b> Speechly powered Input: {listening ? "on" : "off"}</b>
                    </Text>
                    <Button onClick={SpeechRecognition.startListening}>
                      Start
                    </Button>
                    <Button onClick={SpeechRecognition.stopListening}>
                      Stop
                    </Button>
                    <Button onClick={clearTranscript}>Clear</Button>
                    <Button onClick={setDescription}>
                      {desc == "" ? "Not Saved" : "Saved"}
                    </Button>
                  </HStack>
                  <br />
                  <Button
                    mb={4}
                    type="button"
                    onClick={generateDescriptionWithAI}
                    bg="white"
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? "Generating..."
                      : "Craft with AI Magic  °☆."}
                  </Button>
                  <FormControl mb={4}>
                    <FormLabel color="white">Priority</FormLabel>
                    <Select
                      color="white"
                      value={formData.priority}
                      onChange={(e) =>
                        handleInputChange("priority", e.target.value)
                      }
                    >
                      <option value="">Select the priority</option>
                      {themes.map((theme) => (
                        <option key={theme.value} value={theme.value}>
                          {theme.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel color="white">Image Upload</FormLabel>
                    <Input
                      color="white"
                      p={1}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <Button
                      mt={4}
                      type="button"
                      onClick={getImageURLwithAI}
                      bg="white"
                    >
                      {isGeneratingImage
                        ? "Generating..."
                        : "Fetch Unsplash Image"}
                    </Button>
                    {formData.image && (
                      <Box mt="12px">
                        <Image
                          cloudName={cloudinaryConfig.cloudName}
                          publicId={formData.image}
                          width="100"
                          crop="scale"
                        />
                      </Box>
                    )}
                  </FormControl>

                  <Button
                    type="submit"
                    bg="white"
                    mr={3}
                    onClick={handleGoBack}
                  >
                    Back
                  </Button>
                  <Button type="submit" bg="white" disabled={isUploading}>
                    {isUploading ? "Uploading..." : "Submit"}
                  </Button>
                </form>
              </Box>
            </Box>
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};
export default Form;
