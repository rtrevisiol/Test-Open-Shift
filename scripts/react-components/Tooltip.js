/**
 * Created by ruggerotrevisiol on 01/02/17.
 
 Questo Componente accetta un'unico parametro che è l'oggetto tooltip così costituito:
 {
 title:"inserire qui il titolo",
 content:"inserire qui il contenuto"
 }
 */
export class Tooltip extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.componentDidMount = this.componentDidMount.bind(this);
    this.state = {
      idTooltip: "tooltip_generic" + parseInt(Math.random() * (new Date()).getTime())
    };
  }
  componentDidMount() {
    var tooltip = this.props.tooltip;
    var $el = $("#" + this.state.idTooltip);
    if (tooltip) {
      var tooltipContent = $('<p style="text-align:left;"><strong>' + tooltip.title + '</strong>' + tooltip.content + '</p>');
      if (tooltip.content.length > 0) {
        $el.tooltipster({
          content: tooltipContent,
          multiple: true
        });
      }
    }
  }
  render() {
    var self = this;
    var tooltip = this.props.tooltip;
    var html = (<span>&nbsp;</span>);
    if (tooltip) {
      html = (<div id={this.state.idTooltip} className="tooltipCustom">?</div>);
    }
    return (html);
  }
}