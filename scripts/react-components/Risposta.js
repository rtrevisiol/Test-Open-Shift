/**
 * Created by ruggerotrevisiol on 11/04/17.
 */
import {MainScope} from  "../js-tools/MainScope";
export class Risposta extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.setAnswer = this.setAnswer.bind(this);
    this.toggleAnswer = this.toggleAnswer.bind(this);
    // this.onBlur = this.onBlur.bind(this);
    // this.updateField = this.updateField.bind(this);
    // this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    // this.trovaPagina = this.trovaPagina.bind(this);
    this.state = {
      risposte: this.props.risposte
    };
  }
    setAnswer(index1, index2, index3, answer) {
        /*
        console.info("domanda", index1);
        console.info("sottodomanda", index3);
        console.info("risposta", index2);
        console.info("answer", answer[index2]);
        */
        var questionario = JSON.parse(MainScope.getPolizza("survey"));

        if (index3!=undefined) {
            questionario.questions[index1].subQuestions[index3].answers[index2].selected = answer[index2].selected;
            // questionario.questions[index1].subQuestions[index3].answers[index2] = answer[index2];
        } else {
            questionario.questions[index1].answers[index2].selected = answer[index2].selected;
            // questionario.questions[index1].answers[index2] = answer[index2];
        }
        // console.info("questionario", questionario);
        MainScope.setPolizza("survey",JSON.stringify(questionario));
        window.questionario = questionario
    }
    toggleAnswer(e, a) {
        var self = this;
        var i = e.target.id.split("risposta_")[1];
        var classSelect = "selected glyphicon glyphicon-check";
        var classUnSelect = "glyphicon glyphicon-unchecked";

        var state = this.state, index1, index2, index3;
        for (let n in this.state.risposte) {
            if (i != n) {
                state.risposte[n].selected = false;
            }
        }
        state.risposte[i].selected = !(state.risposte[i].selected);
        var questionario = JSON.parse(MainScope.getPolizza("survey"));

        var answer = state.risposte[i];
        this.setState(state);

        if (questionario) {
            questionario.questions.forEach(function (question, index1) {
                var answers = question.answers;
                if (answers) {
                    // Questo è il caso delle domande di primo livello - Rug
                    answers.forEach(function (answer, index2) {
                        if (answer.name == $(e.target).data("name")) {
                            self.setAnswer(index1, index2, index3, self.state.risposte);
                        }
                    });
                } else {
                    // Questo è il caso delle domande di secondo livello - Rug
                    var subQuestions = question.subQuestions;
                    if (subQuestions) {
                        subQuestions.forEach(function (question, index3) {
                            var answers = question.answers;
                            if (answers) {
                                answers.forEach(function (answer, index2) {
                                    if (answer.name == $(e.target).data("name")) {
                                        self.setAnswer(index1, index2, index3, self.state.risposte);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    }
    render() {
        var risposte = [];
        var classSelect = "selected glyphicon glyphicon-check";
        var classUnSelect = "glyphicon glyphicon-unchecked";

        for (let i in this.state.risposte) {
            var risposta = this.state.risposte[i], myClass = "";
            if (risposta.selected) {
                myClass = classSelect;
            } else {
                myClass = classUnSelect;
            }
            risposte.push(<div className={"valore " + myClass} id={"risposta_" + i} key={"risposta_" + i}
                               onClick={this.toggleAnswer}
                               data-name={risposta.name}
                               data-selected={risposta.selected}
                               data-index={i}
                               data-value={risposta.value}
                               title={risposta.value}></div>);
        }
        var html = (<span></span>);
        if(risposte.length>0){
            html = (<span className="risposta dinamica">{risposte}</span>)
        }
        return html;
    }
    }