import { useState, useRef, Fragment, useEffect } from "react";
import { backArrow, camera, image, mic, deleteIcon } from "../assets";
import { filter, forEach, map } from "lodash";
import { useNavigate, useParams } from "react-router-dom";
import { patch } from "../services/api";
import useApi from "../hooks/useApi";
import Loader from "./Loader";

const fileTypes = {
  video: "video/*",
  audio: "audio/*",
  image: "image/*",
};
const NoteDetail = () => {
  const [title, setTitle] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [contents, setContents] = useState([{ type: "text", value: "" }]);
  const ref = useRef(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, loading } = useApi(id);

  useEffect(() => {
    if (data) {
      setContents([...data.contents, { type: "text", value: "" }]);
      setTitle(data.title);
    }
  }, [data]);

  useEffect(() => {
    ref.current.style.height = ref.current.scrollHeight + "px";
  }, [title]);

  useEffect(() => {
    forEach(contents, (note, index) => {
      if (note.type === "text") {
        const textarea = document.getElementById("note " + index);
        textarea.style.height = textarea.scrollHeight + "px";
      }
    });
  }, [contents]);

  // Function to store a note title
  const handleTitle = (e) => {
    const { value } = e.target;
    e.preventDefault();
    ref.current.style.height = ref.current.scrollHeight + "px";
    setTitle(value);
  };

  // Function to store a note texts
  const handleNote = (e, index) => {
    const { value, name } = e.target;
    e.preventDefault();
    const textarea = document.getElementById(name);
    textarea.style.height = textarea.scrollHeight + "px";
    setContents((prevContents) => {
      const updatedContents = [...prevContents];
      updatedContents[index] = { ...updatedContents[index], value };
      return updatedContents;
    });
  };

  // Function to store a note files like image audio and video
  const onFileSelect = (e) => {
    const { files, name } = e.target;
    e.preventDefault();
    const file = files[0];
    // check if selected file type is valid or note
    if (file.type?.startsWith?.(`${name}/`)) {
      const reader = new FileReader();
      reader.onload = ({ target }) => {
        contents.push({
          type: name,
          value: Object.assign(file, {
            preview: target.result,
            contentType: file.type,
          }),
        });
        const sortNotes = filter([...contents], ({ value }) => !!value);
        setContents([...sortNotes, { type: "text", value: "" }]);
      };
      reader.readAsDataURL(file);
    } else {
      alert(`Please select a valid ${name} file.`);
    }
  };

  // Function to delete a note image
  const deleteContent = (e, index) => {
    e.preventDefault();
    setContents((prevContents) => {
      const updatedContents = [...prevContents];
      updatedContents.splice(index, 1);
      return updatedContents;
    });
  };

  // Function to handle a file content
  const onAttachmentClick = (e, name) => {
    e.preventDefault();
    fileRef.current.accept = fileTypes[name];
    fileRef.current.name = name;
    fileRef.current.click();
  };

  // Function to update data at backend
  const onSave = () => {
    const params = {
      title,
      contents: filter(contents, ({ value }) => !!value),
    };
    if (title?.trim()) {
      setLoading(true);
      patch(`/${id}`, params).then(
        ({ status }) => {
          if (status === 200) {
            setLoading(false);
            navigateToBack();
          }
        },
        (err) => {
          console.log(err.message);
          setLoading(false);
        }
      );
    } else {
      alert(`Please select a valid ${name} file.`);
    }
  };
  const onGoBack = () => {
    if (window.confirm("Are you sure you want to discart changes?")) {
      navigateToBack();
    }
  };
  const navigateToBack = () => {
    navigate(-1);
  };
  return (
    <>
      {loading || isLoading ? <Loader /> : null}
      <div className="container min-vw-100" style={{ padding: "2rem" }}>
        <div className="row">
          <div className="col col-1" />
          <div className="col-10 d-flex justify-content-between">
            <div className="back-button" onClick={onGoBack}>
              <img src={backArrow} />
            </div>
            <div>
              <button onClick={onSave} className="save-button">
                Save
              </button>
            </div>
          </div>
          <div className="col col-1" />
        </div>
        <div className="row">
          <div className="col col-2" />
          <div className="col col-8">
            <textarea
              ref={ref}
              className="input-title"
              placeholder="Title"
              onChange={handleTitle}
              value={title}
            />
          </div>
          <div className="col col-2" />
        </div>
        {map(contents, ({ type, value }, index) => {
          return (
            <Fragment key={index}>
              {type === "text" ? (
                <div className="row pb-4">
                  <div className="col col-2" />
                  <div className="col col-8">
                    <textarea
                      id={"note " + index}
                      name={"note " + index}
                      className="input-note"
                      placeholder="Start typing..."
                      value={value}
                      onChange={(e) => handleNote(e, index)}
                    />
                  </div>
                  <div className="col col-2" />
                </div>
              ) : type === "image" ? (
                <div className="row pb-4">
                  <div className="col col-md-4" />
                  <div className="col col-md-4">
                    <div className="position-relative">
                      <img
                        style={{
                          height: "-webkit-fill-available",
                          width: "-webkit-fill-available",
                        }}
                        src={value.preview}
                        alt="Image Preview"
                      />
                      <div className="position-absolute top-0 end-0 m-3">
                        <button
                          className="delete-button"
                          onClick={(e) => deleteContent(e, index)}
                        >
                          <img src={deleteIcon} alt="Delete Image" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col col-md-4"></div>
                </div>
              ) : type === "audio" ? (
                <div className="row pb-4">
                  <div className="col col-md-4"> </div>
                  <div className="col col-md-4">
                    <audio controls src={value.preview} />
                  </div>
                  <div className="col col-md-4"></div>
                </div>
              ) : (
                <div className="row pb-4">
                  <div className="col col-md-4"></div>
                  <div className="col col-md-4">
                    <video
                      controls
                      src={value.preview}
                      style={{
                        height: "-webkit-fill-available",
                        width: "-webkit-fill-available",
                      }}
                    />
                  </div>
                  <div className="col col-md-4"> </div>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="row">
        <input
          ref={fileRef}
          style={{ visibility: "hidden" }}
          type="file"
          onChange={onFileSelect}
        />
      </div>
      <div className="d-flex justify-content-center ">
        <div className="CONTAINER-BOX position-absolute bottom-0 text-center">
          <div className="d-flex justify-content-center row">
            <div className="col-3 p-4">
              <button
                className="input-button"
                onClick={(e) => onAttachmentClick(e, "image")}
              >
                <img src={image} alt="Image" />
              </button>
            </div>
            <div className="col-3 p-4">
              <button
                className="input-button"
                onClick={(e) => onAttachmentClick(e, "video")}
              >
                <img src={camera} alt="Camera" />
              </button>
            </div>
            <div className="col-3 p-4">
              <button
                className="input-button"
                onClick={(e) => onAttachmentClick(e, "audio")}
              >
                <img src={mic} alt="Microphone" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoteDetail;
