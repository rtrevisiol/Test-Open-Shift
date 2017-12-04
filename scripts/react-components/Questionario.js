/**
 * Created by ruggerotrevisiol on 11/04/17.
 */
import {Domanda} from "./Domanda";
import {MainScope} from  "../js-tools/MainScope";
export class Questionario extends React.Component {
  constructor(props){
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
    this.toggleQuest = this.toggleQuest.bind(this);
    this.validaQuestionario = this.validaQuestionario.bind(this);
    this.state = {
      survey: JSON.parse(MainScope.getPolizza("survey")),
      error: []
    };
  }
  componentDidMount() {
    var self = this;
    this.validaQuestionario();
    $(".risposta.dinamica").on("click", function () {
      setTimeout(function () {
        self.validaQuestionario();
      }, 0);
    });
  }
  toggleQuest() {
    var self = this;
    if (self.validaQuestionario()) {
      $("#Questionario").toggle();
    }
    window.scrollTo(0,0);
  }
  validaQuestionario() {
    var self = this, valid = false;
    var state = self.state;
    state.error = [];
    /* *
     if (($(".risposta.dinamica").find(".selected").length) === ($(".risposta.dinamica").length)) {
     valid = true;
     state.error = "";
     } else {
     state.error = "Compilare tutto il questionario";
     }
     /* */
    // inizio MOD v16
    if (($(".risposta.dinamica").find(".selected").length) !== ($(".risposta.dinamica").length)) {
      state.error.push( "ATTENZIONE! Non è stata fornita risposta a una o più domande. Se si vuole proseguire comunque, cliccare sul tasto Avanti." );
    }
    if($($(".risposta.dinamica").find(".selected[title=No]")).length>0){
      state.error.push( "ATTENZIONE! Il contratto in emissione non è coerente con le risposte ricevute." );
    }
    // fine MOD v16
    valid = true;
    // state.error = "";
    /* */
    self.setState(state);
    return valid;
  }
  render() {
    var survey = this.state.survey, self = this, domande = [], title = "", testoErrori = [];
    if (survey) {
      for (let i in survey.questions) {
        var domanda = survey.questions[i];
        domande.push(<Domanda key={"question_" + i} domanda={domanda} subQuestComp={Domanda}/>);
      }
      title = survey.title
    }
    for(let i in self.state.error){
      testoErrori.push(<p key={"error_"+i}>{self.state.error[i]}</p>);
    }
    return (<div>
      <div className="editStep" style={{"position": "inherit", "float": "left"}}>
        <a href="javascript:void(0)" className="glyphicon glyphicon-pencil" onClick={self.toggleQuest}>
          <span>Modifica Questionario Adeguatezza</span>
        </a>
      </div>
      <div id="Questionario" className="myOverlay">
        <div className="cont large row">
          <fieldset className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <h3>{title}</h3>
            <div className="questionarioReact">
              <ol start="0">
                <li>
                  <span className="risposta">
                    <div className="valore">S&Igrave;</div>
                    <div className="valore">NO</div>
                  </span>
                </li>
                {domande}
              </ol>
            </div>
            <div className="has-error">
            <span className="control-label">
            {testoErrori}
            </span></div>
            <div className="btn btn-primary right" onClick={self.toggleQuest}>Salva il questionario</div>
          </fieldset>
        </div>
      </div>
    </div>);
    }
  }