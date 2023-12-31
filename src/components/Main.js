import React from 'react';
import axios from 'axios';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Accordion from 'react-bootstrap/Accordion';
import '../style/Main.css';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import { withAuth0 } from '@auth0/auth0-react';


class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      ageRange: 'All Ages',
      spoilers: false,
      searchResult: null,
      error: '',
      addedToWatch: false,
      renderSpinner: false
    };
  }

  handleSearchChange = (event) => {
    this.setState({ searchQuery: event.target.value });
  };

  handleAgeRangeChange = (event) => {
    this.setState({ ageRange: event.target.value });
  };

  handleSpoilerPreferenceChange = (event) => {
    this.setState({ spoilers: event.target.checked });
  };

  handleSearchSubmit = async (event) => {
    event.preventDefault();
    let spoilers = this.state.spoilers ? ('Please avoid any spoilers.') : ('');
    let prompt = `Evaluate ${this.state.searchQuery} on all of these categories for people of ${this.state.ageRange} : language usage, alcohol and other drugs, portrayal of sex and romantic relationships, positive role models, positive messages, diverse representation, violence, product placement.  Please provide a full response for each category even if the entire movie or show is not appropriate for viewers of this age.  ${spoilers}`;
    this.setState({ renderSpinner: true })

    try {

      let updatedMovieFromAxios = await axios.post(
        `${process.env.REACT_APP_SERVER}/ask/${this.state.searchQuery}`,
        { prompt }
      );

      this.setState({
        searchResult: updatedMovieFromAxios.data.data,
        error: '',
        addedToWatch: false,
      });

    } catch (error) {
      console.log(error.message);
      this.setState({ error: 'An error occurred. Please try again.' });
    } finally {
      this.setState({ renderSpinner: false });
    }
  };

  handleSaveMovie = async () => {
    if (this.props.auth0.isAuthenticated) {
      const res = await this.props.auth0.getIdTokenClaims();
      const jwt = res.__raw;

      const config = {
        headers: { "Authorization": `Bearer ${jwt}` },
        method: 'post',
        baseURL: process.env.REACT_APP_SERVER,
        url: '/movies',
        data: {
          ...this.state.searchResult,
          user: this.props.auth0.user.email
        }
      };

      try {
        let savedMovie = await axios(config);
        console.log('Saved Movie: ', savedMovie);
        this.setState({
          addedToWatch: true,
        })
      } catch (error) {
        console.log(error.message);
      }
    }
  };


  renderMovieDetailsAccordion = () => {
    const { searchResult, renderSpinner } = this.state;

    if (renderSpinner) {
      return (
        <div className="loading-container">
          <Spinner animation="border" role="status" />
          <span className="visually-hidden">Loading...</span>
        </div>
      );
    }

    if (searchResult) {
      return (
        <div className="whole-accordion">
          <div className="card-div">
            <Card style={{ width: '25rem' }} className="text-center">
              <Card.Img variant="top" src={searchResult.imageURL ? searchResult.imageURL : `https://place-hold.it/300x450/666/fff/000?text=${searchResult.title}`} alt="Movie Poster" />
              <Card.Body>
                <Card.Title>{searchResult.title.toUpperCase()}</Card.Title>
                {this.state.addedToWatch ? (
                  <Button variant="success">✅ Movie Saved to Watch List</Button>
                ) : (<Button onClick={() => this.handleSaveMovie()}>Add to Watch List</Button>)
                }
                {this.state.renderSpinner ?
                  (<div className="loading">
                    <Spinner animation="border" />
                    <p>Loading...</p>
                  </div>) : <></>}
              </Card.Body>
            </Card>
          </div>


          <Accordion className="whole-accordion">
            <Accordion.Item eventKey="0">
              <Accordion.Header className="accordion-header">
                <p>Language Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.languageDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header className="accordion-header">
                <p>Drug Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.drugDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="2">
              <Accordion.Header className="accordion-header">
                <p>Sex Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.sexDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="3">
              <Accordion.Header className="accordion-header">
                <p>Role Model Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.roleModelDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="4">
              <Accordion.Header className="accordion-header">
                <p>Message Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.messageDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="5">
              <Accordion.Header className="accordion-header">
                <p>Representation Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.representationDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="6">
              <Accordion.Header className="accordion-header">
                <p>Violence Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.violenceDescription}</Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="7">
              <Accordion.Header className="accordion-header">
                <p>Product Description</p>
              </Accordion.Header>
              <Accordion.Body>{searchResult.productDescription}</Accordion.Body>
            </Accordion.Item>
          </Accordion>

        </div>

      );
    }

    return null;
  };

  render() {
    const error = this.state.error;

    return (

      <div className="movie-container" key={this.state.renderSpinner ? 'loading' : 'loaded'}>
        <h2>Personalized Movie Content Reviews</h2>
        <p>Use the search bar to check the maturity level of movies or shows. Search results powered by OpenAI.</p>
        <aside>
          <p><strong>Note:</strong> Our backend operates on a free server via Render. On your first search, please allow up to 30 seconds for response time as the server spins up after being inactive. Additionally, queries to OpenAI can add up to an extra 15 seconds in wait time.</p>
        </aside>

        <div className="search-container">
          <Form onSubmit={this.handleSearchSubmit}>
            <Form.Group controlId="searchQuery" className="d-flex flex-column align-items-start">
              <Form.Control
                type="text"
                value={this.state.searchQuery}
                onChange={this.handleSearchChange}
                placeholder="Search Movies or Shows"
                className="mb-2"
              />
              <Form.Select onChange={this.handleAgeRangeChange} aria-label="Default select example">
                <option>Select age range</option>
                <option value="ages 3-5">Ages 3-5</option>
                <option value="ages 6-10">Ages 6-10</option>
                <option value="ages 11-13">Ages 11-13</option>
                <option value="ages 14-17">Ages 14-17</option>
                <option value="all ages">All Ages</option>
              </Form.Select>
              <Form.Check
                type="switch"
                id="custom-switch"
                label="Avoid Spoilers?"
                onChange={this.handleSpoilerPreferenceChange}
                className="mb-2"
              />
              <Button className="search-button" variant="primary" type="submit">
                Search
              </Button>
            </Form.Group>
          </Form>
        </div>

        {error && <p className="error-message">{error}</p>}
        {this.renderMovieDetailsAccordion()}
      </div>
    );
  }
}

export default withAuth0(Main);

