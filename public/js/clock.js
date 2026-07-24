function waktu(){

const sekarang=new Date();

document.getElementById("jam").innerHTML=
sekarang.toLocaleTimeString("id-ID");

document.getElementById("tanggal").innerHTML=
sekarang.toLocaleDateString("id-ID",{

weekday:"long",

day:"numeric",

month:"long",

year:"numeric"

});

}

setInterval(waktu,1000);

waktu();