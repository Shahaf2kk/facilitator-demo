/* Demo data — invented people and schools. */
const DEMO_SEED = {
 "version": 1,
 "base_week": "2026-11-08",
 "facilitators": [
  {
   "id": "p3",
   "name": "מיכל אברהם",
   "location": "עכו",
   "email": "michal@example.com",
   "phone": "050-0000003",
   "status": "active",
   "days": [
    0,
    1,
    4
   ],
   "team_prep": 0,
   "team_training": 1,
   "parent_lecture": 1,
   "at_risk": 0,
   "coordination": 0,
   "is_facilitator": 1,
   "tags": [
    "שנה א׳"
   ],
   "notes": ""
  },
  {
   "id": "p2",
   "name": "יונתן כהן",
   "location": "קריות",
   "email": "yonatan@example.com",
   "phone": "050-0000002",
   "status": "active",
   "days": [
    0,
    1,
    4
   ],
   "team_prep": 1,
   "team_training": 0,
   "parent_lecture": 0,
   "at_risk": 0,
   "coordination": 0,
   "is_facilitator": 1,
   "tags": [
    "שנה א׳"
   ],
   "notes": ""
  },
  {
   "id": "p1",
   "name": "נועה לוי",
   "location": "חיפה",
   "email": "noa@example.com",
   "phone": "050-0000001",
   "status": "active",
   "days": [
    0,
    1,
    2,
    3,
    4
   ],
   "team_prep": 0,
   "team_training": 1,
   "parent_lecture": 0,
   "at_risk": 0,
   "coordination": 0,
   "is_facilitator": 1,
   "tags": [
    "שנים מתקדמות"
   ],
   "notes": ""
  },
  {
   "id": "c1",
   "name": "רונית שמעוני",
   "location": "חיפה",
   "email": "ronit@example.com",
   "phone": "050-0000004",
   "status": "coordinator",
   "days": [],
   "team_prep": 0,
   "team_training": 0,
   "parent_lecture": 0,
   "at_risk": 0,
   "coordination": 0,
   "is_facilitator": 0,
   "tags": [],
   "notes": ""
  },
  {
   "id": "c2",
   "name": "אורית ברק",
   "location": "נשר",
   "email": "orit@example.com",
   "phone": "050-0000005",
   "status": "coordinator",
   "days": [],
   "team_prep": 0,
   "team_training": 0,
   "parent_lecture": 0,
   "at_risk": 0,
   "coordination": 0,
   "is_facilitator": 0,
   "tags": [],
   "notes": ""
  }
 ],
 "frameworks": [
  {
   "id": "w1",
   "name": "הכשרה לצוות מרכז נוער אופק",
   "grade": "",
   "hours": "14:00-16:00",
   "session_count": 3,
   "type": "informal",
   "badge": "training",
   "contact_name": "שרה מזרחי",
   "contact_phone": "04-0000001",
   "facilitators_per_round": 1,
   "round_facilitators": [],
   "rounds_count": 1,
   "notes": "",
   "status": "confirmed"
  },
  {
   "id": "w2",
   "name": "תיכון הרצל יא",
   "grade": "יא",
   "hours": "09:45-11:05 / 11:20-12:40",
   "session_count": 6,
   "type": "formal",
   "badge": "",
   "contact_name": "דוד פרץ",
   "contact_phone": "04-0000002",
   "facilitators_per_round": 1,
   "round_facilitators": [],
   "rounds_count": 1,
   "notes": "",
   "status": "waiting"
  },
  {
   "id": "w3",
   "name": "מועדון נוער גלים יא",
   "grade": "יא",
   "hours": "10:00-11:20",
   "session_count": 1,
   "type": "informal",
   "badge": "",
   "contact_name": "",
   "contact_phone": "",
   "facilitators_per_round": 1,
   "round_facilitators": [],
   "rounds_count": 1,
   "notes": "",
   "status": "tentative"
  },
  {
   "id": "w4",
   "name": "חטיבת ביניים אלון ט",
   "grade": "ט",
   "hours": "08:30-10:05 / 10:25-11:55",
   "session_count": 4,
   "type": "formal",
   "badge": "",
   "contact_name": "רינה גולן",
   "contact_phone": "04-0000004",
   "facilitators_per_round": 1,
   "round_facilitators": [],
   "rounds_count": 1,
   "notes": "",
   "status": "confirmed"
  },
  {
   "id": "w5",
   "name": "תיכון רמות יא",
   "grade": "יא",
   "hours": "08:00-09:35 / 09:40-11:30 / 11:35-13:10",
   "session_count": 6,
   "type": "formal",
   "badge": "",
   "contact_name": "",
   "contact_phone": "",
   "facilitators_per_round": 1,
   "round_facilitators": [],
   "rounds_count": 1,
   "notes": "",
   "status": "tentative"
  }
 ],
 "assignments": [
  {
   "id": "a1",
   "framework_id": "w1",
   "coordinator_ids": [],
   "sessions": [
    {
     "session_date": "2026-11-08",
     "status": "active",
     "facilitator_ids": [
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-11-29",
     "status": "active",
     "facilitator_ids": [
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-12-20",
     "status": "active",
     "facilitator_ids": [
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-02-07",
     "status": "active",
     "facilitator_ids": [
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-05-02",
     "status": "active",
     "facilitator_ids": [
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-05-09",
     "status": "active",
     "facilitator_ids": [
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-05-16",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    }
   ]
  },
  {
   "id": "a2",
   "framework_id": "w2",
   "coordinator_ids": [],
   "sessions": [
    {
     "session_date": "2027-02-07",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-02-14",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-02-21",
     "status": "active",
     "facilitator_ids": [
      "p1",
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-02-28",
     "status": "active",
     "facilitator_ids": [
      "p1",
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    }
   ]
  },
  {
   "id": "a3",
   "framework_id": "w3",
   "coordinator_ids": [],
   "sessions": [
    {
     "session_date": "2027-01-25",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-02-08",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-02-22",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-03-01",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    }
   ]
  },
  {
   "id": "a4",
   "framework_id": "w4",
   "coordinator_ids": [],
   "sessions": [
    {
     "session_date": "2026-11-26",
     "status": "active",
     "facilitator_ids": [
      "p1",
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-12-02",
     "status": "active",
     "facilitator_ids": [
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-12-03",
     "status": "active",
     "facilitator_ids": [
      "p1",
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-12-07",
     "status": "active",
     "facilitator_ids": [
      "p1",
      "p3"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-12-09",
     "status": "active",
     "facilitator_ids": [
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2026-12-16",
     "status": "active",
     "facilitator_ids": [
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    }
   ]
  },
  {
   "id": "a5",
   "framework_id": "w5",
   "coordinator_ids": [],
   "sessions": [
    {
     "session_date": "2026-12-29",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-01-04",
     "status": "active",
     "facilitator_ids": [
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-01-05",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-01-11",
     "status": "active",
     "facilitator_ids": [
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-01-12",
     "status": "active",
     "facilitator_ids": [
      "p1"
     ],
     "coordinator_id": null,
     "rounds": []
    },
    {
     "session_date": "2027-01-18",
     "status": "active",
     "facilitator_ids": [
      "p2"
     ],
     "coordinator_id": null,
     "rounds": []
    }
   ]
  }
 ],
 "holidays": [
  {
   "id": 1,
   "holiday_date": "2026-09-11",
   "name": "ערב ראש השנה"
  },
  {
   "id": 2,
   "holiday_date": "2026-09-12",
   "name": "ראש השנה"
  },
  {
   "id": 3,
   "holiday_date": "2026-09-13",
   "name": "ראש השנה"
  },
  {
   "id": 4,
   "holiday_date": "2026-09-20",
   "name": "ערב יום כיפור"
  },
  {
   "id": 5,
   "holiday_date": "2026-09-21",
   "name": "יום כיפור"
  },
  {
   "id": 6,
   "holiday_date": "2026-09-25",
   "name": "ערב סוכות"
  },
  {
   "id": 7,
   "holiday_date": "2026-09-26",
   "name": "סוכות"
  },
  {
   "id": 8,
   "holiday_date": "2026-09-27",
   "name": "סוכות"
  },
  {
   "id": 9,
   "holiday_date": "2026-09-28",
   "name": "סוכות"
  },
  {
   "id": 10,
   "holiday_date": "2026-09-29",
   "name": "סוכות"
  },
  {
   "id": 11,
   "holiday_date": "2026-09-30",
   "name": "סוכות"
  },
  {
   "id": 12,
   "holiday_date": "2026-10-01",
   "name": "סוכות"
  },
  {
   "id": 13,
   "holiday_date": "2026-10-02",
   "name": "סוכות"
  },
  {
   "id": 14,
   "holiday_date": "2026-10-03",
   "name": "שמיני עצרת / שמחת תורה"
  },
  {
   "id": 15,
   "holiday_date": "2026-10-22",
   "name": "יום הזיכרון ליצחק רבין"
  },
  {
   "id": 17,
   "holiday_date": "2026-12-04",
   "name": "חנוכה"
  },
  {
   "id": 18,
   "holiday_date": "2026-12-05",
   "name": "חנוכה"
  },
  {
   "id": 19,
   "holiday_date": "2026-12-06",
   "name": "חנוכה"
  },
  {
   "id": 20,
   "holiday_date": "2026-12-07",
   "name": "חנוכה"
  },
  {
   "id": 21,
   "holiday_date": "2026-12-08",
   "name": "חנוכה"
  },
  {
   "id": 22,
   "holiday_date": "2026-12-09",
   "name": "חנוכה"
  },
  {
   "id": 23,
   "holiday_date": "2026-12-10",
   "name": "חנוכה"
  },
  {
   "id": 24,
   "holiday_date": "2026-12-11",
   "name": "חנוכה"
  },
  {
   "id": 25,
   "holiday_date": "2026-12-12",
   "name": "חנוכה"
  },
  {
   "id": 26,
   "holiday_date": "2027-01-23",
   "name": "ט\"ו בשבט"
  },
  {
   "id": 27,
   "holiday_date": "2027-03-22",
   "name": "תענית אסתר"
  },
  {
   "id": 28,
   "holiday_date": "2027-03-22",
   "name": "ערב פורים"
  },
  {
   "id": 29,
   "holiday_date": "2027-03-23",
   "name": "פורים"
  },
  {
   "id": 30,
   "holiday_date": "2027-03-24",
   "name": "שושן פורים"
  },
  {
   "id": 31,
   "holiday_date": "2027-04-21",
   "name": "ערב פסח"
  },
  {
   "id": 32,
   "holiday_date": "2027-04-22",
   "name": "פסח"
  },
  {
   "id": 33,
   "holiday_date": "2027-04-23",
   "name": "פסח"
  },
  {
   "id": 34,
   "holiday_date": "2027-04-24",
   "name": "פסח"
  },
  {
   "id": 35,
   "holiday_date": "2027-04-25",
   "name": "פסח"
  },
  {
   "id": 36,
   "holiday_date": "2027-04-26",
   "name": "פסח"
  },
  {
   "id": 37,
   "holiday_date": "2027-04-27",
   "name": "פסח"
  },
  {
   "id": 38,
   "holiday_date": "2027-04-28",
   "name": "פסח"
  },
  {
   "id": 39,
   "holiday_date": "2027-05-03",
   "name": "ערב יום השואה"
  },
  {
   "id": 40,
   "holiday_date": "2027-05-04",
   "name": "יום השואה"
  },
  {
   "id": 41,
   "holiday_date": "2027-05-10",
   "name": "ערב יום הזיכרון"
  },
  {
   "id": 42,
   "holiday_date": "2027-05-11",
   "name": "יום הזיכרון"
  },
  {
   "id": 43,
   "holiday_date": "2027-05-12",
   "name": "יום העצמאות"
  },
  {
   "id": 44,
   "holiday_date": "2027-05-25",
   "name": "ל\"ג בעומר"
  },
  {
   "id": 45,
   "holiday_date": "2027-06-10",
   "name": "ערב שבועות"
  },
  {
   "id": 46,
   "holiday_date": "2027-06-11",
   "name": "שבועות"
  }
 ],
 "users": [
  {
   "id": "u_c1",
   "email": "ronit@example.com",
   "name": "רונית שמעוני",
   "role": "coordinator",
   "facilitator_id": "c1"
  },
  {
   "id": "u_c2",
   "email": "orit@example.com",
   "name": "אורית ברק",
   "role": "coordinator",
   "facilitator_id": "c2"
  },
  {
   "id": "u_p1",
   "email": "noa@example.com",
   "name": "נועה לוי",
   "role": "facilitator",
   "facilitator_id": "p1"
  },
  {
   "id": "u_p2",
   "email": "yonatan@example.com",
   "name": "יונתן כהן",
   "role": "facilitator",
   "facilitator_id": "p2"
  },
  {
   "id": "u_p3",
   "email": "michal@example.com",
   "name": "מיכל אברהם",
   "role": "facilitator",
   "facilitator_id": "p3"
  }
 ],
 "sent": [
  {
   "assignment_id": "a4",
   "session_date": "2026-12-02",
   "facilitator_id": "p2",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a4",
   "session_date": "2026-12-09",
   "facilitator_id": "p2",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a4",
   "session_date": "2026-12-16",
   "facilitator_id": "p2",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a1",
   "session_date": "2026-11-08",
   "facilitator_id": "p3",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a1",
   "session_date": "2026-11-29",
   "facilitator_id": "p3",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a1",
   "session_date": "2026-12-20",
   "facilitator_id": "p3",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a1",
   "session_date": "2027-02-07",
   "facilitator_id": "p3",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a1",
   "session_date": "2027-05-02",
   "facilitator_id": "p3",
   "sent_at": "2026-11-01T09:00:00"
  },
  {
   "assignment_id": "a1",
   "session_date": "2027-05-09",
   "facilitator_id": "p3",
   "sent_at": "2026-11-01T09:00:00"
  }
 ],
 "confirmations": [
  {
   "assignment_id": "a4",
   "session_date": "2026-12-02",
   "facilitator_id": "p2",
   "status": "confirmed"
  },
  {
   "assignment_id": "a4",
   "session_date": "2026-12-09",
   "facilitator_id": "p2",
   "status": "confirmed"
  },
  {
   "assignment_id": "a4",
   "session_date": "2026-12-16",
   "facilitator_id": "p2",
   "status": "confirmed"
  }
 ],
 "ics": []
};
