import { useEffect, useMemo, useRef, useState } from "react";
import { get, onValue, push, ref, set } from "firebase/database";
import { db } from "./firebase.js";
import { recordChoice } from "../lib/recordChoice.mjs";
import { fieldPlace, fieldStudy, nextFieldStep, paceLabelFor } from "../lib/expansion.mjs";
import { markRepair, reviewRecord } from "../lib/markRepair.mjs";

const CACHE_PREFIX = "sophia-store-v1:";

function readCache(key, fallback) {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

function listFromSnapshot(value) {
  if (!value) return [];
  return Object.entries(value).map(([id, record]) => ({ id, ...record }));
}

export function useLearningStore(user) {
  const [library, setLibrary] = useState(() => readCache("items", null));
  const [strands, setStrands] = useState(() => readCache("strands", null));
  const [catalog, setCatalog] = useState(() => readCache("catalog_interests", null));
  const [entranceCatalog, setEntranceCatalog] = useState(() => readCache("catalog_entrance", null));
  const [tree, setTree] = useState(() => readCache("catalog_tree", null));

  const [attempts, setAttempts] = useState(null);
  const [parent, setParent] = useState(null);
  const [repairs, setRepairs] = useState(null);
  const [interests, setInterests] = useState(null);
  const [entrance, setEntrance] = useState(null);
  const [pace, setPace] = useState(null);

  const [guides, setGuides] = useState({});
  const [sourceCache, setSourceCache] = useState({});
  const [chosenField, setChosenField] = useState("");
  const [pendingRepair, setPendingRepair] = useState(null);
  const [confirmedMatch, setConfirmedMatch] = useState(null);
  const [primerDismissed, setPrimerDismissed] = useState({});

  const [saving, setSaving] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState("");
  const [entranceSaving, setEntranceSaving] = useState(false);
  const [entranceError, setEntranceError] = useState("");
  const [paceSaving, setPaceSaving] = useState(false);
  const [paceError, setPaceError] = useState("");

  const savingRef = useRef(false);

  useEffect(() => {
    if (!user) return undefined;
    const unsubItems = onValue(ref(db, "items"), (snapshot) => {
      const list = listFromSnapshot(snapshot.val());
      setLibrary(list);
      writeCache("items", list);
    });
    const unsubStrands = onValue(ref(db, "strands"), (snapshot) => {
      const val = snapshot.val() || {};
      setStrands(val);
      writeCache("strands", val);
    });
    const unsubAttempts = onValue(ref(db, `attempts/${user.uid}`), (snapshot) => {
      setAttempts(listFromSnapshot(snapshot.val()));
    });
    const unsubRole = onValue(ref(db, `roles/${user.uid}/parent`), (snapshot) => {
      setParent(snapshot.val() === true);
    });
    const unsubRepairs = onValue(ref(db, `repairs/${user.uid}`), (snapshot) => {
      setRepairs(snapshot.val() || {});
    });
    const unsubCatalog = onValue(ref(db, "catalog/interests"), (snapshot) => {
      const val = snapshot.val() || {};
      setCatalog(val);
      writeCache("catalog_interests", val);
    });
    const unsubEntranceCatalog = onValue(ref(db, "catalog/entrance"), (snapshot) => {
      const val = snapshot.val() || {};
      setEntranceCatalog(val);
      writeCache("catalog_entrance", val);
    });
    const unsubTree = onValue(ref(db, "catalog/tree"), (snapshot) => {
      const val = snapshot.val() || {};
      setTree(val);
      writeCache("catalog_tree", val);
    });
    const unsubInterests = onValue(ref(db, `interests/${user.uid}`), (snapshot) => {
      setInterests(snapshot.val() || {});
    });
    const unsubEntrance = onValue(ref(db, `entrance/${user.uid}`), (snapshot) => {
      setEntrance(snapshot.val() || {});
    });
    const unsubPace = onValue(ref(db, `pace/${user.uid}`), (snapshot) => {
      setPace(snapshot.val() || {});
    });

    return () => {
      unsubItems();
      unsubStrands();
      unsubAttempts();
      unsubRole();
      unsubRepairs();
      unsubCatalog();
      unsubEntranceCatalog();
      unsubTree();
      unsubInterests();
      unsubEntrance();
      unsubPace();
    };
  }, [user]);

  useEffect(() => {
    if (user) return;
    setPendingRepair(null);
    setConfirmedMatch(null);
    setGuides({});
    setRepairs(null);
    setChosenField("");
    setInterests(null);
    setEntrance(null);
    setPace(null);
    setInterestError("");
    setEntranceError("");
    setPaceError("");
    setPrimerDismissed({});
  }, [user]);

  const fields = useMemo(
    () => fieldStudy(strands || {}, library || [], attempts || [], repairs || {}),
    [strands, library, attempts, repairs],
  );

  const step = useMemo(() => {
    if (!chosenField || !library) return null;
    return nextFieldStep(strands || {}, library, attempts || [], repairs || {}, chosenField);
  }, [chosenField, strands, library, attempts, repairs]);

  const fieldRepair = step?.kind === "repair" ? { item: step.item, selected: step.selected } : null;
  const pendingHere = Boolean(
    pendingRepair?.item?.id
    && chosenField
    && fieldPlace(strands || {}, library || [], pendingRepair.item).id === chosenField
    && !(typeof repairs?.[pendingRepair.item.id]?.answer === "string" && repairs[pendingRepair.item.id].answer.trim()),
  );
  const activeRepair = chosenField ? (pendingHere ? pendingRepair : fieldRepair) : null;

  useEffect(() => {
    if (!pendingRepair || repairs === null) return;
    const saved = repairs[pendingRepair.item.id]?.answer;
    if (typeof saved === "string" && saved.trim()) setPendingRepair(null);
  }, [repairs, pendingRepair]);

  useEffect(() => {
    const itemId = activeRepair?.item?.id;
    if (!user || !itemId || guides[itemId]) return undefined;
    let cancel = false;
    let timer = 0;
    async function load(attempt) {
      try {
        const snapshot = await get(ref(db, `guides/${itemId}`));
        if (cancel) return;
        setGuides((current) => ({ ...current, [itemId]: snapshot.val() || {} }));
        setRecordError("");
      } catch {
        if (cancel) return;
        if (attempt < 4) {
          timer = window.setTimeout(() => load(attempt + 1), 200);
          return;
        }
        setRecordError("The next question did not load. Try it again.");
      }
    }
    load(0);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [user, activeRepair?.item?.id, guides]);

  useEffect(() => {
    const sourceId = step?.item?.sourceId;
    if (!user || !sourceId) return undefined;
    let cancel = false;
    get(ref(db, `sources/${sourceId}`)).then((snapshot) => {
      if (cancel) return;
      setSourceCache((current) => {
        if (current[sourceId]) return current;
        return { ...current, [sourceId]: snapshot.val() || { title: sourceId, body: "" } };
      });
    }).catch(() => {
      if (cancel) return;
      setSourceCache((current) => {
        if (current[sourceId]) return current;
        return { ...current, [sourceId]: { title: sourceId, body: "" } };
      });
    });
    return () => { cancel = true; };
  }, [user, step?.item?.sourceId]);

  async function submitChoice(item, selected) {
    if (!item || !selected || savingRef.current || activeRepair) return false;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
    const attemptRef = push(ref(db, `attempts/${user.uid}`));
    const payload = {
      itemId: item.id,
      strandId: item.strandId,
      ideaId: item.ideaId,
      answerKind: "choice",
      selected,
      submittedAt: Date.now(),
    };
    try {
      const matched = await recordChoice((body) => set(attemptRef, body), payload);
      if (!matched) {
        const missRef = ref(db, `misses/${user.uid}/${item.id}`);
        try {
          await set(missRef, { selected, matched: false, submittedAt: payload.submittedAt });
        } catch (error) {
          if (error?.code !== "PERMISSION_DENIED") throw error;
        }
        setPendingRepair({ item, selected });
      } else {
        const choiceText = item.choices?.[selected]?.text || selected;
        setConfirmedMatch({ item, choiceText });
      }
      return true;
    } catch {
      setPendingRepair(null);
      setRecordError("That answer was not recorded. Try it again.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function submitWritten(item, text) {
    const clean = text.trim();
    if (!item || !clean || savingRef.current || activeRepair) return false;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
    const attemptRef = push(ref(db, `attempts/${user.uid}`));
    try {
      await set(attemptRef, {
        itemId: item.id,
        strandId: item.strandId,
        ideaId: item.ideaId,
        answerKind: item.answerKind || "essay",
        answer: clean,
        submittedAt: Date.now(),
      });
      return true;
    } catch {
      setRecordError("That written answer was not recorded. Try it again.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function submitRepair(text) {
    const clean = text.trim();
    if (!activeRepair || !clean || savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
    const itemId = activeRepair.item.id;
    const submittedAt = Date.now();
    try {
      await set(ref(db, `repairs/${user.uid}/${itemId}`), {
        answer: clean,
        submittedAt,
      });
      try {
        const guide = guides[itemId] || {};
        const mark = markRepair(clean, guide);
        await set(ref(db, `reviews/${user.uid}/${itemId}`), reviewRecord(itemId, mark, submittedAt));
      } catch {
        // Repair already saved; auto-mark is secondary.
      }
      return true;
    } catch {
      setRecordError("That written answer was not saved. Try it again.");
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function saveInterests(nextInterests) {
    if (!user || interestSaving) return;
    setInterestSaving(true);
    setInterestError("");
    try {
      await set(ref(db, `interests/${user.uid}`), nextInterests);
    } catch {
      setInterestError("Those interests were not saved. Try it again.");
    } finally {
      setInterestSaving(false);
    }
  }

  async function saveEntrance(nextEntrance) {
    if (!user || entranceSaving) return;
    setEntranceSaving(true);
    setEntranceError("");
    try {
      await set(ref(db, `entrance/${user.uid}`), nextEntrance);
    } catch {
      setEntranceError("Those entrance subjects were not saved. Try it again.");
    } finally {
      setEntranceSaving(false);
    }
  }

  async function savePace(fieldId, rating) {
    if (!user || !fieldId || paceSaving) return;
    const value = Math.min(5, Math.max(1, Number(rating) || 3));
    const label = paceLabelFor(value);
    if (!label) return;
    setPaceSaving(true);
    setPaceError("");
    try {
      await set(ref(db, `pace/${user.uid}/${fieldId}`), {
        rating: value,
        label,
        submittedAt: Date.now(),
      });
    } catch {
      setPaceError("That difficulty rating was not saved. Try it again.");
    } finally {
      setPaceSaving(false);
    }
  }

  const ready = Boolean(
    library && strands && attempts && repairs !== null && parent !== null
    && catalog !== null && entranceCatalog !== null && tree !== null
    && interests !== null && entrance !== null && pace !== null,
  );

  return {
    ready,
    library,
    strands,
    attempts,
    parent,
    repairs,
    guides,
    catalog,
    entranceCatalog,
    tree,
    interests,
    entrance,
    pace,
    sourceCache,
    fields,
    step,
    activeRepair,
    chosenField,
    setChosenField,
    pendingRepair,
    setPendingRepair,
    confirmedMatch,
    setConfirmedMatch,
    primerDismissed,
    dismissPrimer: (fieldId) => setPrimerDismissed((prev) => ({ ...prev, [fieldId]: true })),
    saving,
    recordError,
    setRecordError,
    interestSaving,
    interestError,
    entranceSaving,
    entranceError,
    paceSaving,
    paceError,
    submitChoice,
    submitWritten,
    submitRepair,
    saveInterests,
    saveEntrance,
    savePace,
  };
}
