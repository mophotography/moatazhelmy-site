var lb=document.getElementById('lb'),li=lb.querySelector('img');
document.querySelectorAll('.ph').forEach(function(b){b.addEventListener('click',function(){var m=b.querySelector('img');li.src=m.src;li.alt=m.alt;lb.classList.add('on');lb.focus()})});
function cl(){lb.classList.remove('on')}lb.addEventListener('click',cl);document.addEventListener('keydown',function(e){if(e.key==='Escape')cl()});