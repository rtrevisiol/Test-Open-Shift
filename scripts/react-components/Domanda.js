/**
 * Created by ruggerotrevisiol on 11/04/17.
 */
import {Risposta} from "./Risposta";
export class Domanda extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      domanda: this.props.domanda,
      sottoDomande: this.props.domanda.subQuestions,
      risposte: this.props.domanda.answers
    }
  }
  render() {
    const SubQuestComp = this.props.subQuestComp;
    var risposte = this.state.risposte;
    var sottoDomande = this.state.sottoDomande, sottoDomandeHTML = [], sub;
    for (let i in sottoDomande) {
      var sottoDomanda = sottoDomande[i];
      sottoDomandeHTML.push(<SubQuestComp key={"subQuest_" + i} domanda={sottoDomanda}/>);
    }
    sub = <ul className="sottoDomanda">{sottoDomandeHTML}</ul>;
    return (<li>
      <p>
        {this.state.domanda.question}
    </p>
    <Risposta risposte={risposte}/>
    {sub}
    </li>);
  }
}