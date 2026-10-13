/* ------------------------- toasts & modale ------------------------- */
function toast(msg, err) {
  const box = $("#toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "toast" + (err ? " err" : "");
  el.innerHTML = "<i></i><span></span>";
  el.lastChild.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 220); }, 2800);
}
let modalReturn = null;
function openModal(title, html) {
  const m = $("#modal"), box = $("#modal .mbox");
  if (!m.classList.contains("on")) modalReturn = document.activeElement;
  $("#mTitle").textContent = title;
  $("#mBody").innerHTML = html;
  m.classList.add("on");
  document.body.classList.add("modal-open");
  box.scrollTop = 0;
  box.setAttribute("tabindex", "-1");
  box.focus({ preventScroll: true });
}
function closeModal() {
  const m = $("#modal");
  if (!m.classList.contains("on")) return;
  m.classList.remove("on");
  document.body.classList.remove("modal-open");
  if (modalReturn && document.contains(modalReturn)) try { modalReturn.focus({ preventScroll: true }); } catch (e) { }
  modalReturn = null;
}
