function saveTemplate() {
    console.log("@@@@@@@@@@@@@@@@ HERE @@@@@@@@@@@@@@@@@@@@@@");
    var template = document.getElementById("template").value;
    $.ajax({
        url: '/template-dashboard/uploadLetterTemplate',
        data: {
            template: template
        },
        type: 'POST',
        success: function(d){
            console.log("success in drive")
            window.location.href = '/template-dashboard';
        },
        error: function() {
            console.log("error in drive")
        }
    })
}

