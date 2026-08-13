function ScheduleSettings({
  roomsAvailable = 3,
  setRoomsAvailable,
  days = [],
  setDays,
  slots = [],
  setSlots,
}) {
  const updateDays = (value) => {
    const newDays = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setDays(newDays);
  };

  const updateSlots = (value) => {
    const newSlots = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSlots(newSlots);
  };

  return (
    <div className="settings-grid">

      {/* ================================
          ROOMS
      ================================= */}

      <div className="setting-card">

        <div className="setting-icon">
          🏫
        </div>

        <div className="setting-content">

          <label>
            Rooms Available
          </label>

          <p>
            Maximum rooms per time slot
          </p>

          <input
            className="setting-input room-input"
            type="number"
            min="1"
            value={roomsAvailable}
            onChange={(e) =>
              setRoomsAvailable(
                Number(e.target.value)
              )
            }
          />

        </div>

      </div>


      {/* ================================
          DAYS
      ================================= */}

      <div className="setting-card">

        <div className="setting-icon">
          📅
        </div>

        <div className="setting-content">

          <label>
            Days
          </label>

          <p>
            Working days
          </p>

          <input
            className="setting-input"
            type="text"
            value={days.join(",")}
            onChange={(e) =>
              updateDays(e.target.value)
            }
            placeholder="Mon,Tue,Wed,Thu,Fri"
          />

        </div>

      </div>


      {/* ================================
          TIME SLOTS
      ================================= */}

      <div className="setting-card">

        <div className="setting-icon">
          ⏰
        </div>

        <div className="setting-content">

          <label>
            Time Slots
          </label>

          <p>
            Available class periods
          </p>

          <input
            className="setting-input"
            type="text"
            value={slots.join(",")}
            onChange={(e) =>
              updateSlots(e.target.value)
            }
            placeholder="9AM,10AM,11AM,1PM,2PM"
          />

        </div>

      </div>

    </div>
  );
}

export default ScheduleSettings;