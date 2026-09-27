import emailjs from '@emailjs/browser';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const sendAbsenceAlerts = async (absentStudents, date, settings, addToast) => {
  if (!settings.enableAutoAlerts) return;
  if (!absentStudents || absentStudents.length === 0) return;

  const dateStr = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  let emailsSent = 0;
  let emailsFailed = 0;
  let smsList = [];

  addToast(`Sending alerts to ${absentStudents.length} absent student(s)...`, 'info');

  for (let i = 0; i < absentStudents.length; i++) {
    const student = absentStudents[i];

    // ── Send individual Email via EmailJS ──
    if (
      student.email &&
      settings.emailjsServiceId &&
      settings.emailjsTemplateId &&
      settings.emailjsPublicKey
    ) {
      try {
        await emailjs.send(
          settings.emailjsServiceId,
          settings.emailjsTemplateId,
          {
            parent_name:  student.parentName || 'Parent/Guardian',
            student_name: student.name,
            date:         dateStr,
            school_name:  settings.schoolName || 'School',
            parent_email: student.email,   // sends to THIS student's parent email
          },
          settings.emailjsPublicKey
        );
        emailsSent++;
        console.log(`✅ Email sent for ${student.name} to ${student.email}`);

        // Wait 600ms between each email to avoid EmailJS rate limiting
        if (i < absentStudents.length - 1) {
          await delay(600);
        }
      } catch (error) {
        emailsFailed++;
        console.error(`❌ Email failed for ${student.name}:`, error.text || error);
      }
    }

    // ── Log SMS (requires paid Twilio backend) ──
    if (student.contact) {
      const msg = `Dear ${student.parentName || 'Parent'}, your ward ${student.name} is marked ABSENT on ${dateStr}. - ${settings.schoolName || 'School'}`;
      smsList.push({ to: student.contact, message: msg });
      console.log(`[SMS Queued → ${student.contact}]: ${msg}`);
    }
  }

  // Show final result toast
  if (emailsSent > 0) {
    addToast(`✅ ${emailsSent} email alert(s) sent to parents successfully!`, 'success');
  }
  if (emailsFailed > 0) {
    addToast(`⚠️ ${emailsFailed} email(s) could not be sent. Check console.`, 'error');
  }
  if (smsList.length > 0) {
    addToast(`📱 ${smsList.length} SMS queued (connect Twilio to send real SMS).`, 'info');
  }
};
