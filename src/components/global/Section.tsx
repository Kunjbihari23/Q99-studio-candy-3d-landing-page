const Section = ({
  className,
  divClassname,
  children,
}: {
  className?: string;
  divClassname?: string;
  children: React.ReactNode;
}) => {
  return (
    <section className={`h-screen ${className}`}>
      <div className={`container-custom h-full ${divClassname}`}>
        {children}
      </div>
    </section>
  );
};
export default Section;
