class FunctionsC {
  constructor(props) {
    this.props = props;
    this.aggiornaDate = this.aggiornaDate.bind(this);
  }
  aggiornaDate() {
    var campoSource = arguments[0][0], campoDest = arguments[0][1], campoDifferenza = arguments[0][2];
    console.log("campoDifferenza");
    console.log(campoDifferenza);
    var nodo = document.getElementById(campoDest);
    var $el = $(nodo).closest(".form-group");
    var input = $el.find("input");
    var differenza = $(document.getElementById(campoDifferenza)).val();
    if ($(document.getElementById(campoSource)).bootstrapDP("getDate")) {
      if ($(document.getElementById(campoSource)).length > 0) {
        var dataSource = $(document.getElementById(campoSource)).bootstrapDP("getDate").getTime();
        console.log(campoSource);
        console.log("==>" + dataSource);
        var dataDest = dataSource + (differenza * 86400000) + 14400000; // 86400000 è una giornata in millisecondi ;) - aggiungiamo 4 ore (14400000) per il bug del cambio ora ad ottobre - Rug
      }
      if ($(document.getElementById(campoDest)).length > 0) {
        console.log(campoDest);
        console.log("==>" + dataDest);
        $(document.getElementById(campoDest)).bootstrapDP("setDate", new Date(dataDest));
      }
    }
  }
}
export const Functions = new FunctionsC();