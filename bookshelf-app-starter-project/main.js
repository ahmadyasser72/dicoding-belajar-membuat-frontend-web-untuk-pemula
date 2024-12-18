/**
 * @typedef {Object} Book
 * @property {string | number} id
 * @property {string} title
 * @property {string} author
 * @property {string} year
 * @property {boolean} isComplete
 */

const STORAGE_KEY = "bookshelf-app-v1";

document.addEventListener("DOMContentLoaded", () => {
  const inputForm = {
    /** @type {HTMLFormElement} */
    root: document.getElementById("bookForm"),
    /** @type {HTMLInputElement} */
    title: document.getElementById("bookFormTitle"),
    /** @type {HTMLInputElement} */
    author: document.getElementById("bookFormAuthor"),
    /** @type {HTMLInputElement} */
    year: document.getElementById("bookFormYear"),
    /** @type {HTMLInputElement} */
    isComplete: document.getElementById("bookFormIsComplete"),

    clear: () => {
      inputForm.title.value =
        inputForm.author.value =
        inputForm.year.value =
          "";

      inputForm.isComplete.checked = false;
      inputForm.isComplete.dispatchEvent(new Event("change"));
    },
    /** @param {Book['id']} [id] */
    toBook: (id) => ({
      id: id ?? Date.now(),
      title: inputForm.title.value,
      author: inputForm.author.value,
      year: Number(inputForm.year.value),
      isComplete: inputForm.isComplete.checked,
    }),

    /** @type {HTMLHeadingElement} */
    heading: document.getElementById("bookFormHeading"),
    /** @type {HTMLButtonElement} */
    submitButton: document.getElementById("bookFormSubmit"),
  };

  const book = {
    /** @type {Book[]} */
    items: JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"),

    /** @param {Book} item */
    add: (item) => {
      book.items.push(item);
      book.save();
    },

    /**
     * @param {Book['id']} id
     * @param {(it: Book) => Book} callback
     */
    update: (id, callback) => {
      const idx = book.items.findIndex((it) => it.id === id);
      if (idx != -1) {
        const item = book.items[idx];
        book.items[idx] = callback(item);
        book.save();
      }
    },

    /** @param {Book['id']} id */
    delete: (id) => {
      const idx = book.items.findIndex((it) => it.id === id);
      if (idx != -1) {
        book.items.splice(idx, 1);
        book.save();
      }
    },

    /** @param {Book[]} [items] */
    render: (items) => {
      const completeBookList = document.getElementById("completeBookList"),
        incompleteBookList = document.getElementById("incompleteBookList");

      incompleteBookList.innerHTML = "";
      completeBookList.innerHTML = "";

      items ??= book.items;
      if (items.length === 0) return;

      /**
       * function shortcut untuk membuat element html bernama `{name}`
       * @param {string} name
       * @returns {HTMLElement}
       */
      const h = (name) => document.createElement(name);

      /**
       * function shortcut membuat button
       * @param {string} testid
       * @param {string} text
       * @param {() => void} onclick
       * @returns {HTMLButtonElement}
       */
      const btn = (testid, text, onclick) => {
        const button = h("button");
        button.dataset.testid = testid;
        button.innerText = text;
        button.addEventListener("click", onclick);
        return button;
      };

      for (const { id, title, author, year, isComplete } of items) {
        const bookParent = isComplete ? completeBookList : incompleteBookList;

        const bookContainer = bookParent.appendChild(h("div"));
        bookContainer.dataset.bookid = id;
        bookContainer.dataset.testid = "bookItem";

        const heading = bookContainer.appendChild(h("h3"));
        heading.dataset.testid = "bookItemTitle";
        heading.innerText = title;

        const authorText = bookContainer.appendChild(h("p"));
        authorText.dataset.testid = "bookItemAuthor";
        authorText.innerText = `Penulis: ${author}`;

        const yearText = bookContainer.appendChild(h("p"));
        yearText.dataset.testid = "bookItemYear";
        yearText.innerText = `Tahun: ${year}`;

        const actionContainer = bookContainer.appendChild(h("div"));

        if (isComplete) {
          actionContainer.appendChild(
            btn("bookItemIsCompleteButton", "Belum selesai dibaca", () => {
              book.update(id, (book) => ({ ...book, isComplete: false }));
            })
          );
        } else {
          actionContainer.appendChild(
            btn("bookItemIsCompleteButton", "Selesai dibaca", () => {
              book.update(id, (book) => ({ ...book, isComplete: true }));
            })
          );
        }

        actionContainer.appendChild(
          btn("bookItemDeleteButton", "Hapus buku", () => book.delete(id))
        );

        actionContainer.appendChild(
          btn("bookItemEditButton", "Edit buku", () => {
            inputForm.title.value = title;
            inputForm.author.value = author;
            inputForm.year.value = year;
            inputForm.isComplete.checked = isComplete;

            inputForm.heading.innerText = "Update Buku";
            inputForm.submitButton.innerText = "Simpan Buku";

            inputForm.root.dataset.edit = id;
            inputForm.title.focus();
          })
        );
      }
    },

    save: () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(book.items));
      book.render();
    },
  };

  book.render();

  inputForm.root.addEventListener("submit", (event) => {
    event.preventDefault();

    const { edit: editId } = inputForm.root.dataset;
    if (editId !== undefined) {
      inputForm.heading.innerText = "Tambah Buku Baru";
      inputForm.submitButton.innerHTML =
        "Masukkan Buku ke rak <span>Belum selesai dibaca</span>";

      book.update(Number(editId), ({ id }) => inputForm.toBook(id));
      delete inputForm.root.dataset.edit;
      document
        .querySelector(`[data-bookid='${editId}']`)
        .scrollIntoView({ behavior: "smooth" });
    } else {
      book.add(inputForm.toBook());
    }

    inputForm.clear();
  });

  inputForm.isComplete.addEventListener("change", () => {
    const bookStatus = inputForm.submitButton.querySelector("span");
    if (bookStatus)
      bookStatus.innerText = inputForm.isComplete.checked
        ? "Selesai dibaca"
        : "Belum selesai dibaca";
  });

  document.getElementById("searchBook").addEventListener("submit", (event) => {
    event.preventDefault();

    const query =
      document.getElementById("searchBookTitle").value?.toLowerCase() ?? "";

    if (query === "") book.render();
    else
      book.render(
        book.items.filter((item) =>
          Object.values(item).join("").toLowerCase().includes(query)
        )
      );
  });
});
