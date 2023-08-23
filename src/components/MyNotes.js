import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Heading,
  Text,
  Select,
  Image,
  Box,
  HStack,
  Flex,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Divider,
  Avatar,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { SiMicrosoftonenote } from "react-icons/si";
import { useNavigate } from "react-router-dom";

const themes = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const MyNotes = () => {
  const navigate = useNavigate();
  const { logout } = useAuth0();
  const [data, setData] = useState();
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedEvent, setEditedEvent] = useState(null);

  const GetUserQuery = `
  query User($email: Email!) {
    user(by: {email:$email }) {
      id
    }
  }
`;

  const userCreate = `
 mutation UserCreate($name: String! $email: Email! $profileUrl: URL!){
  userCreate(input: {name:$name email:$email profileUrl:$profileUrl}) {
    user {
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
          "x-api-key":`${process.env.REACT_APP_GRAFBASE_API}`,
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
    return result.data?.user;
  };

  const postNewUser = async (user) => {
    const username = user.name;
    const email = user.email;
    const profileUrl = user.picture;

    const response = await fetch(
      "https://notesphere-main-pujaagarwal5263.grafbase.app/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":`${process.env.REACT_APP_GRAFBASE_API}`,
        },
        body: JSON.stringify({
          query: userCreate,
          variables: {
            name: username,
            email: email,
            profileUrl: profileUrl,
          },
        }),
      }
    );

    const result = await response.json();
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated && user !== undefined) {
        console.log("User is authenticated:", user);
        const hasUsers = await getUserByEmailID(user.email);
        console.log("has users --", hasUsers);
        if (hasUsers == null) {
          const userPosted = await postNewUser(user);
          if (userPosted.data != null) {
            console.log("user posted successfully");
          } else {
            console.log("could not post user", userPosted);
          }
        }
      }
    };
    fetchData();
    fetchNotes();
  }, [isAuthenticated, user]);

  const handleGoBack = () => {
    navigate("/form");
  };

  const GetNotesQuery = `
  query User($first: Int! $email:Email!) {
    user(by: {email:$email}) {
      notes(first: $first) {
            edges {
              node {
                id
                name
                description
                priority
                nodeUrl
                createdAt
              }
            }
          }
    }
  }
`;

  const DeleteNotesQuery = `
 mutation NoteDelete($id: ID) {
  noteDelete(by: {id:$id}) {
      deletedId
    }
  }
 `;

  const fetchNotes = async () => {
    const email = user?.email;
    const response = await fetch(
      "https://notesphere-main-pujaagarwal5263.grafbase.app/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":`${process.env.REACT_APP_GRAFBASE_API}`,
        },
        body: JSON.stringify({
          query: GetNotesQuery,
          variables: {
            first: 100,
            email: email,
          },
        }),
      }
    );

    const result = await response.json();
    console.log("result for notes", result);
    setData(result);
  };

  const handleEventID = async (eventID) => {
    console.log("event ID", eventID);
    const response = await fetch(
      "https://notesphere-main-pujaagarwal5263.grafbase.app/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":`${process.env.REACT_APP_GRAFBASE_API}`,
        },
        body: JSON.stringify({
          query: DeleteNotesQuery,
          variables: {
            id: eventID,
          },
        }),
      }
    );

    const result = await response.json();
    if (result?.data?.eventDelete?.deletedId) {
    } else {
      console.log("could not delete");
    }
    fetchNotes();
  };

  const editEventID = (eventID) => {
    const eventToEdit = data?.data?.user?.notes?.edges?.find(
      ({ node }) => node.id == eventID
    );
    setEditedEvent(eventToEdit ? { ...eventToEdit.node } : null);
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  };

  const NoteUpdate = `
  mutation NoteUpdate($id: ID $name: String! $description: String! $priority:String!){
    noteUpdate(by: {id:$id}, input: {name:$name description:$description priority:$priority}){
      note {
        updatedAt
      }
    }
  }
  `;

  const saveEditedEvent = async () => {
    const response = await fetch(
      "https://notesphere-main-pujaagarwal5263.grafbase.app/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key":`${process.env.REACT_APP_GRAFBASE_API}`,
           },
        body: JSON.stringify({
          query: NoteUpdate,
          variables: {
            id: editedEvent.id,
            name: editedEvent.name,
            description: editedEvent.description,
            priority: editedEvent.priority,
          },
        }),
      }
    );

    const result = await response.json();
    if (result.data != null) {
      console.log("event submitted successfully");
      setIsEditModalOpen(false);
      fetchNotes();
    } else {
      console.log(result);
      console.log("error in saving event");
    }
  };
  const formatDate = (date) => {
    const originalDate = new Date(date);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = months[originalDate.getMonth()];
    const day = originalDate.getDate();
    const hour = originalDate.getHours() % 12 || 12;
    const minute = originalDate.getMinutes();
    const ampm = originalDate.getHours() < 12 ? "AM" : "PM";
    const formattedDate = `${month} ${day}, ${hour}.${minute
      .toString()
      .padStart(2, "0")} ${ampm}`;
    return formattedDate;
  };

  return (
    <Box bg="black!important">
      <Box px="24px" py="16px" bg="#000000" borderBottom="1px solid #363739">
        <HStack display="flex" justifyContent="space-between">
          <Box>
            <Icon as={SiMicrosoftonenote} h={6} w={6} color="white" mr="8px" />
            <Text as="b" fontSize="3xl" color="white">
              NoteSphere
            </Text>
          </Box>
          {isAuthenticated && (
            <Box display="flex" alignItems="center">
              <Text fontSize="lg" color="white" mr="16px">
                {user?.name}
              </Text>
              <Avatar size="sm" mr={2} name={user?.email} src={user?.picture} />
              <Button onClick={handleGoBack}> Create Notes</Button>
              <Button onClick={() => logout()} ml="16px">
                Logout
              </Button>
            </Box>
          )}
        </HStack>
      </Box>
      <Box pl={100} bg="black">
        <Heading color="white" mt={2} mb={1} ml={490}>
          My Notes
        </Heading>
     <br />
        <Tabs align='end' variant='enclosed' width="89%" ml="5%">
  <TabList>
    <Tab _selected={{ color: 'white', bg: '#9A2EFE', borderBottom:"2px solid white" }} color="white">All Notes</Tab>
    <Tab _selected={{ color: 'white', bg: '#9A2EFE', borderBottom:"2px solid white" }} color="white">High</Tab>
    <Tab _selected={{ color: 'white', bg: '#9A2EFE', borderBottom:"2px solid white" }} color="white">Medium</Tab>
    <Tab _selected={{ color: 'white', bg: '#9A2EFE', borderBottom:"2px solid white" }} color="white">Low</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>
    <VStack height="100%" mb="10">
          {data && (
            <>
              {data?.data?.user?.notes?.edges?.map(({ node }) => (
                <Box
                  background="linear-gradient(to right,black, #9A2EFE)"
                  key={node.id}
                  borderRadius="lg"
                  p={4}
                  m={2}
                  marginBottom="5"
                  color="white"
                  width="90%"
                  border="1px solid #363739"
                >
                  <HStack spacing={5}>
                    <Image
                      src={node.nodeUrl}
                      alt="Event"
                      mb={2}
                      h={300}
                      w={379}
                    />
                     <VStack align="start" spacing={2}>
                      <Heading size="md" mb={2}>
                        {node.name}
                      </Heading>
                      <Text mb={2} align="start">{node.description}</Text>
                     <HStack>
                      <Text mb={1}>
                      {formatDate(node.createdAt)} &nbsp; | &nbsp;
                      </Text>
                      <Text mb={1}>Priority: {node.priority}</Text>
                      </HStack>
                      <HStack>
                      <Button onClick={() => editEventID(node.id)} mr={4}>
                        Edit
                      </Button>
                      <Button onClick={() => handleEventID(node.id)}>
                        Delete
                      </Button>
                      </HStack>
                    </VStack>
                   
                  </HStack>
                </Box>
              ))}
            </>
          )}
        </VStack>
    </TabPanel>
    <TabPanel>
    <VStack height="100vh" mb="10">
          {data && (
            <>
              {data?.data?.user?.notes?.edges?.map(({ node }) => (
                node.priority == "High" && (
                <Box
                  background="linear-gradient(to right,black, #9A2EFE)"
                  key={node.id}
                  borderRadius="lg"
                  p={4}
                  m={2}
                  marginBottom="5"
                  color="white"
                  width="90%"
                  border="1px solid #363739"
                >
                  <HStack spacing={5}>
                    <Image
                      src={node.nodeUrl}
                      alt="Event"
                      mb={2}
                      h={300}
                      w={379}
                    />
                     <VStack align="start" spacing={2}>
                      <Heading size="md" mb={2}>
                        {node.name}
                      </Heading>
                      <Text mb={2} align="start">{node.description}</Text>
                    </VStack>
                  </HStack>
                </Box>
                )
              ))}
            </>
          )}
        </VStack>
    </TabPanel>
    <TabPanel>
    <VStack height="100vh" mb="10">
          {data && (
            <>
              {data?.data?.user?.notes?.edges?.map(({ node }) => (
                node.priority == "Medium" && (
                <Box
                  background="linear-gradient(to right,black, #9A2EFE)"
                  key={node.id}
                  borderRadius="lg"
                  p={4}
                  m={2}
                  marginBottom="5"
                  color="white"
                  width="90%"
                  border="1px solid #363739"
                >
                  <HStack spacing={5}>
                    <Image
                      src={node.nodeUrl}
                      alt="Event"
                      mb={2}
                      h={300}
                      w={379}
                    />
                    <VStack align="start" spacing={2}>
                      <Heading size="md" mb={2}>
                        {node.name}
                      </Heading>
                      <Text mb={2} align="start">{node.description}</Text>
                    </VStack>
                  </HStack>
                </Box>
                )
              ))}
            </>
          )}
        </VStack>
    </TabPanel>
    <TabPanel>
    <VStack height="100vh" mb="10">
          {data && (
            <>
              {data?.data?.user?.notes?.edges?.map(({ node }) => (
                node.priority == "Low" && (
                  <Box
                  background="linear-gradient(to right, black, #9A2EFE)"
                  key={node.id}
                  borderRadius="lg"
                  p={4}
                  m={2}
                  marginBottom="5"
                  color="white"
                  width="90%"
                  border="1px solid #363739"
                >
                  <HStack spacing={5}>
                    <Image src={node.nodeUrl} alt="Event" mb={2} h={300} w={379} />
                    <VStack align="start" spacing={2}>
                      <Heading size="md" mb={2}>
                        {node.name}
                      </Heading>
                      <Text mb={2} align="start">{node.description}</Text>
                    </VStack>
                  </HStack>
                </Box>
                )
              ))}
            </>
          )}
        </VStack>
    </TabPanel>
  </TabPanels>
</Tabs>
      </Box>

      {/* Modal for Editing Event */}
      {isEditModalOpen && editedEvent && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editedEvent={editedEvent}
          handleEditChange={handleEditChange}
          saveEditedEvent={saveEditedEvent}
          themes={themes}
        />
      )}
    </Box>
  );
};

const EditEventModal = ({
  isOpen,
  onClose,
  editedEvent,
  handleEditChange,
  saveEditedEvent,
  themes,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        sx={{
          background: "black",
          border: "1px solid #363739",
        }}
        color="white"
        boderRadius="xl"
      >
        <ModalHeader fontSize={34}>Edit Event</ModalHeader>
        <Text ml={26} color="red.600">
          Note: **you can only edit few details of your notes **
        </Text>
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Title</FormLabel>
            <Input
              type="text"
              name="name"
              value={editedEvent.name}
              onChange={handleEditChange}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Content</FormLabel>
            <Input
              type="text"
              name="description"
              value={editedEvent.description}
              onChange={handleEditChange}
            />
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Priority</FormLabel>
            <Select
              name="priority"
              value={editedEvent.priority}
              onChange={handleEditChange}
            >
              <option value="">Select a theme</option>
              {themes.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={saveEditedEvent} mr={4}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MyNotes;
