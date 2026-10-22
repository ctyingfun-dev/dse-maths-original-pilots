(() => {
  window.pilotCurriculumNotice = question => {
    const text = typeof question === "string" ? question : [
      question.topic, question.prompt, question.summary,
      ...(question.topics || []), ...(question.concepts || [])
    ].join(" ");
    return /極[坐座]標|极[坐座]标|[極极][角徑径]|polar\s+coordinates?/i.test(text)
      ? '<span class="curriculum-status">已取消</span>' : "";
  };
  const year = new URLSearchParams(location.search).get("year");
  if (year === "2020" && window.PILOT_2020) window.PILOT = window.PILOT_2020;
  if (year === "2021" && window.PILOT_2021) window.PILOT = window.PILOT_2021;
  if (year === "2022" && window.PILOT_2022) window.PILOT = window.PILOT_2022;
  if (year === "2023" && window.PILOT_2023) window.PILOT = window.PILOT_2023;
  if (year === "2024" && window.PILOT_2024) window.PILOT = window.PILOT_2024;
  if (year === "2025" && window.PILOT_2025) window.PILOT = window.PILOT_2025;
  document.documentElement.dataset.year = String(window.PILOT.year || 2026);
})();
