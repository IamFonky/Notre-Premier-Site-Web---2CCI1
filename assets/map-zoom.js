(() => {
  const mapObject = document.querySelector(".atlas-map object");
  const zoomOutput = document.querySelector("[data-map-zoom-level]");
  const zoomButtons = document.querySelectorAll("[data-map-zoom]");
  const maximumZoom = 20;
  let svgDocument;
  let svgRoot;
  let initialViewBox;
  let currentViewBox;
  let pendingLink = null;
  let pointers = new Map();
  let previousPinchDistance = 0;
  let suppressNextClick = false;
  let dragState = null;
  let touchPanState = null;

  const setViewBox = (viewBox) => {
    const width = Math.max(initialViewBox.width / maximumZoom, Math.min(initialViewBox.width, viewBox.width));
    const height = width * initialViewBox.height / initialViewBox.width;
    const x = Math.max(initialViewBox.x, Math.min(initialViewBox.x + initialViewBox.width - width, viewBox.x));
    const y = Math.max(initialViewBox.y, Math.min(initialViewBox.y + initialViewBox.height - height, viewBox.y));
    currentViewBox = { x, y, width, height };
    svgRoot.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    zoomOutput.value = `${Math.round(initialViewBox.width / width * 100)} %`;
    zoomOutput.textContent = zoomOutput.value;
  };

  const zoomAt = (factor, point) => {
    const width = currentViewBox.width / factor;
    const height = currentViewBox.height / factor;
    const relativeX = (point.x - currentViewBox.x) / currentViewBox.width;
    const relativeY = (point.y - currentViewBox.y) / currentViewBox.height;
    setViewBox({
      x: point.x - relativeX * width,
      y: point.y - relativeY * height,
      width,
      height
    });
  };

  const pointInSvg = (clientX, clientY) => {
    const point = svgRoot.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(svgRoot.getScreenCTM().inverse());
  };

  const zoomToShape = (shape) => {
    const bounds = shape.getBBox();
    if (!bounds.width && !bounds.height) return;
    const padding = 1.5;
    const targetWidth = Math.max(bounds.width, bounds.height * initialViewBox.width / initialViewBox.height) * padding;
    const width = Math.min(initialViewBox.width, Math.max(initialViewBox.width / maximumZoom, targetWidth));
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    setViewBox({ x: centerX - width / 2, y: centerY - width * initialViewBox.height / initialViewBox.width / 2, width });
  };

  const pointerDistance = () => {
    const [first, second] = [...pointers.values()];
    return Math.hypot(first.x - second.x, first.y - second.y);
  };

  const setupMap = () => {
    svgDocument = mapObject.contentDocument;
    svgRoot = svgDocument && svgDocument.documentElement;
    if (!svgRoot || !svgRoot.viewBox || !svgRoot.viewBox.baseVal.width) return;

    const viewBox = svgRoot.viewBox.baseVal;
    svgRoot.style.touchAction = "none";
    svgRoot.style.cursor = "grab";
    initialViewBox = { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height };
    currentViewBox = { ...initialViewBox };

    svgRoot.addEventListener("click", (event) => {
      if (suppressNextClick) {
        event.preventDefault();
        suppressNextClick = false;
        return;
      }
      const shape = event.target.closest("path, circle, ellipse, polygon, rect");
      if (!shape || shape.id === "ocean") return;
      const link = shape.closest("a");
      if (link && pendingLink === link) {
        pendingLink = null;
        return;
      }
      event.preventDefault();
      pendingLink = link;
      zoomToShape(shape);
    });

    svgRoot.addEventListener("wheel", (event) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.25 : 0.8, pointInSvg(event.clientX, event.clientY));
    }, { passive: false });

    svgRoot.addEventListener("pointerdown", (event) => {
      suppressNextClick = false;
      if (event.pointerType === "touch") {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size === 1) {
          const bounds = svgRoot.getBoundingClientRect();
          touchPanState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            scaleX: currentViewBox.width / bounds.width,
            scaleY: currentViewBox.height / bounds.height,
            viewBox: { ...currentViewBox },
            moved: false
          };
        } else if (pointers.size === 2) {
          touchPanState = null;
          pointers.forEach((pointer, pointerId) => svgRoot.setPointerCapture(pointerId));
          previousPinchDistance = pointerDistance();
        }
        return;
      }
      if (event.button !== 0) return;
      const bounds = svgRoot.getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scaleX: currentViewBox.width / bounds.width,
        scaleY: currentViewBox.height / bounds.height,
        viewBox: { ...currentViewBox },
        moved: false
      };
      svgRoot.style.cursor = "grabbing";
    });

    svgRoot.addEventListener("pointermove", (event) => {
      if (pointers.has(event.pointerId)) {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size < 2) return;
        event.preventDefault();
        const distance = pointerDistance();
        const midpoint = [...pointers.values()].reduce((point, pointer) => ({ x: point.x + pointer.x / 2, y: point.y + pointer.y / 2 }), { x: 0, y: 0 });
        if (previousPinchDistance > 0 && distance > 0) zoomAt(distance / previousPinchDistance, pointInSvg(midpoint.x, midpoint.y));
        previousPinchDistance = distance;
        suppressNextClick = true;
        return;
      }
      if (pointers.has(event.pointerId) && touchPanState && touchPanState.pointerId === event.pointerId) {
        const deltaX = event.clientX - touchPanState.startX;
        const deltaY = event.clientY - touchPanState.startY;
        if (!touchPanState.moved && Math.hypot(deltaX, deltaY) < 4) return;
        if (!touchPanState.moved) svgRoot.setPointerCapture(event.pointerId);
        touchPanState.moved = true;
        suppressNextClick = true;
        pendingLink = null;
        setViewBox({
          ...touchPanState.viewBox,
          x: touchPanState.viewBox.x - deltaX * touchPanState.scaleX,
          y: touchPanState.viewBox.y - deltaY * touchPanState.scaleY
        });
        return;
      }
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(deltaX, deltaY) < 4) return;
      if (!dragState.moved) svgRoot.setPointerCapture(event.pointerId);
      dragState.moved = true;
      suppressNextClick = true;
      pendingLink = null;
      setViewBox({
        ...dragState.viewBox,
        x: dragState.viewBox.x - deltaX * dragState.scaleX,
        y: dragState.viewBox.y - deltaY * dragState.scaleY
      });
    }, { passive: false });

    const releasePointer = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) previousPinchDistance = 0;
      if (touchPanState && touchPanState.pointerId === event.pointerId) touchPanState = null;
      if (dragState && dragState.pointerId === event.pointerId) {
        dragState = null;
        svgRoot.style.cursor = "grab";
      }
    };
    svgRoot.addEventListener("pointerup", releasePointer);
    svgRoot.addEventListener("pointercancel", releasePointer);
    svgRoot.addEventListener("lostpointercapture", releasePointer);

    zoomButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.mapZoom;
        if (action === "reset") {
          pendingLink = null;
          setViewBox(initialViewBox);
          return;
        }
        zoomAt(action === "in" ? 1.5 : 1 / 1.5, {
          x: currentViewBox.x + currentViewBox.width / 2,
          y: currentViewBox.y + currentViewBox.height / 2
        });
      });
    });
  };

  mapObject.addEventListener("load", setupMap);
  if (mapObject.contentDocument && mapObject.contentDocument.readyState === "complete") setupMap();
})();
